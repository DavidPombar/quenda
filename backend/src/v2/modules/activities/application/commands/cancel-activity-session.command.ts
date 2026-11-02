// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { ActivityRepository } from "../../domain/activity.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { WaitlistOffers } from "../../../../shared/application/waitlist-offers";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type CancelActivitySessionError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">;
/** Cancels one date of an activity (an exception) and frees the court for that time (#97). */
@Injectable()
export class CancelActivitySession {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly clock: Clock,
    private readonly audit: Audit,
    private readonly waitlist: WaitlistOffers,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    reason: string;
  }): Promise<Result<void, CancelActivitySessionError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const reason = args.reason.trim();
    if (!reason) return Result.err(failure("validation"));
    const { tenantId } = args.principal;
    const session = await this.activities.findSession(tenantId, args.id);
    if (!session) return Result.err(failure("not_found"));
    if (session.status === "cancelled") return Result.ok();
    const now = this.clock.now();
    if (Temporal.Instant.compare(session.start, now) <= 0)
      return Result.err(failure("validation"));
    await this.activities.cancelSessions({
      tenantId,
      activityId: session.activityId,
      from: now,
      reason,
      ids: [session.id],
    });
    await this.waitlist.offer({
      tenantId,
      facilityId: session.facilityId,
      start: session.start,
      end: session.end,
      now,
    });
    await this.audit.record(
      args.principal,
      "activity_session.cancelled",
      session.id,
      {
        activityId: session.activityId,
        start: session.start.toString(),
        reason,
      },
    );
    return Result.ok();
  }
}
