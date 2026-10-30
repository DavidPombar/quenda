// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SeasonRepository } from "../../domain/season.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type CancelSeasonAllocationError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">;
/** Withdraws a club's slot; its dates that have not started become bookable again. */
@Injectable()
export class CancelSeasonAllocation {
  constructor(
    private readonly seasons: SeasonRepository,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    reason: string;
  }): Promise<Result<{ freed: number }, CancelSeasonAllocationError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const reason = args.reason.trim();
    if (!reason) return Result.err(failure("validation"));
    const { tenantId } = args.principal;
    const allocation = await this.seasons.findAllocation(tenantId, args.id);
    if (!allocation) return Result.err(failure("not_found"));
    if (allocation.cancelledAt) return Result.ok({ freed: 0 });
    const freed = await this.seasons.cancelAllocation({
      tenantId,
      id: args.id,
      reason,
      at: this.clock.now(),
    });
    await this.audit.record(
      args.principal,
      "season_allocation.cancelled",
      args.id,
      { reason, freed },
    );
    return Result.ok({ freed });
  }
}
