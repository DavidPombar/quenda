// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { ActivityRepository } from "../../domain/activity.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { WaitlistOffers } from "../../../../shared/application/waitlist-offers";
import { EnrolmentRepository } from "../../domain/enrolment.repository";
import { EnrolmentNotices } from "../enrolment-notices";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type CancelActivityError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">;
/**
 * Withdraws an activity (#97): it leaves the catalogue and its sessions that have not started free
 * the court, which may go to the people on its waiting lists (#96). Past sessions are kept;
 * its enrolments end and their people are told.
 */
@Injectable()
export class CancelActivity {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly clock: Clock,
    private readonly audit: Audit,
    private readonly waitlist: WaitlistOffers,
    private readonly enrolments: EnrolmentRepository,
    private readonly notices: EnrolmentNotices,
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
    // Open enrolments end with the activity and each person is told once.
    const open = await this.enrolments.open(tenantId, activity.id);
    for (const enrolment of open) {
      const ended = {
        ...enrolment,
        status: "cancelled" as const,
        endedAt: now,
      };
      await this.enrolments.save(ended);
      await this.notices.notify({
        enrolment: ended,
        kind: "activity_cancelled",
        now,
        details: { reason },
      });
    }
    await this.audit.record(args.principal, "activity.cancelled", activity.id, {
      reason,
      dates: freed.length,
      enrolments: open.length,
    });
    return Result.ok();
  }
}
