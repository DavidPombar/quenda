// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { SeasonRepository } from "../../domain/season.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { WaitlistOffers } from "../../../../shared/application/waitlist-offers";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type CancelSeasonOccurrenceError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">;
/** Frees one date of a club's slot (an exception), for example to resolve a conflict. */
@Injectable()
export class CancelSeasonOccurrence {
  constructor(
    private readonly seasons: SeasonRepository,
    private readonly clock: Clock,
    private readonly audit: Audit,
    private readonly waitlist: WaitlistOffers,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    reason: string;
  }): Promise<Result<void, CancelSeasonOccurrenceError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const reason = args.reason.trim();
    if (!reason) return Result.err(failure("validation"));
    const { tenantId } = args.principal;
    const occurrence = await this.seasons.findOccurrence(tenantId, args.id);
    if (!occurrence) return Result.err(failure("not_found"));
    if (occurrence.status === "cancelled") return Result.ok();
    const now = this.clock.now();
    if (Temporal.Instant.compare(occurrence.start, now) <= 0)
      return Result.err(failure("validation"));
    await this.seasons.cancelOccurrence(tenantId, args.id, reason);
    // The freed date may go to someone on its waiting list (#96).
    await this.waitlist.offer({
      tenantId,
      facilityId: occurrence.facilityId,
      start: occurrence.start,
      end: occurrence.end,
      now,
    });
    await this.audit.record(
      args.principal,
      "season_occurrence.cancelled",
      args.id,
      {
        allocationId: occurrence.allocationId,
        start: occurrence.start.toString(),
        reason,
      },
    );
    return Result.ok();
  }
}
