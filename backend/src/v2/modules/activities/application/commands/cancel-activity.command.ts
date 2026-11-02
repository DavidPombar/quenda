// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { ActivityRepository } from "../../domain/activity.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { WaitlistOffers } from "../../../../shared/application/waitlist-offers";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type CancelActivityError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">;
/**
 * Withdraws an activity (#97): it leaves the catalogue and its sessions that have not started free
 * the court, which may go to the people on its waiting lists (#96). Past sessions are kept.
 */
@Injectable()
export class CancelActivity {
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
  }): Promise<Result<void, CancelActivityError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const reason = args.reason.trim();
    if (!reason) return Result.err(failure("validation"));
    const { tenantId } = args.principal;
    const activity = await this.activities.find(tenantId, args.id);
    if (!activity) return Result.err(failure("not_found"));
    if (activity.status === "cancelled") return Result.ok();
    const now = this.clock.now();
    await this.activities.save({
      ...activity,
      status: "cancelled",
      cancellationReason: reason,
      cancelledAt: now,
    });
    const freed = await this.activities.cancelSessions({
      tenantId,
      activityId: activity.id,
      from: now,
      reason,
    });
    for (const interval of freed)
      await this.waitlist.offer({
        tenantId,
        facilityId: activity.facilityId,
        ...interval,
        now,
      });
    await this.audit.record(args.principal, "activity.cancelled", activity.id, {
      reason,
      dates: freed.length,
    });
    return Result.ok();
  }
}
