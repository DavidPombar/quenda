// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { ActivityRepository } from "../../domain/activity.repository";
import { EnrolmentRepository } from "../../domain/enrolment.repository";
import { EnrolmentQueue } from "../enrolment-queue";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type LeaveActivityError = AppError<"forbidden"> | AppError<"not_found">;
/**
 * The person leaves an activity or its waiting list (#97); a place they held goes at once to the
 * first person waiting. Leaving twice is not an error.
 */
@Injectable()
export class LeaveActivity {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly enrolments: EnrolmentRepository,
    private readonly queue: EnrolmentQueue,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
  }): Promise<Result<void, LeaveActivityError>> {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    const found = await this.enrolments.find(tenantId, args.id);
    if (!found || found.userId !== userId)
      return Result.err(failure("not_found"));
    const activity = await this.activities.find(tenantId, found.activityId);
    // Read again under the activity's lock: a promotion may have changed it meanwhile.
    const enrolment = await this.enrolments.find(tenantId, args.id);
    if (!activity || !enrolment) return Result.err(failure("not_found"));
    if (enrolment.status !== "enrolled" && enrolment.status !== "waiting")
      return Result.ok();
    const now = this.clock.now();
    await this.enrolments.save({ ...enrolment, status: "left", endedAt: now });
    if (enrolment.status === "enrolled" && activity.status === "published")
      await this.queue.fill({
        tenantId,
        activityId: activity.id,
        places: activity.places,
        now,
      });
    await this.audit.record(
      args.principal,
      "activity_enrolment.left",
      enrolment.id,
      { activityId: activity.id, status: enrolment.status },
    );
    return Result.ok();
  }
}
