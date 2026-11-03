// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { ActivityRepository } from "../../domain/activity.repository";
import { EnrolmentRepository } from "../../domain/enrolment.repository";
import { EnrolmentQueue } from "../enrolment-queue";
import { EnrolmentNotices } from "../enrolment-notices";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type RemoveEnrolmentError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">;
/**
 * The municipality removes someone from an activity or its waiting list, with a reason they are
 * told (#97); a place they held goes to the first person waiting.
 */
@Injectable()
export class RemoveEnrolment {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly enrolments: EnrolmentRepository,
    private readonly queue: EnrolmentQueue,
    private readonly notices: EnrolmentNotices,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    reason: string;
  }): Promise<Result<void, RemoveEnrolmentError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const reason = args.reason.trim();
    if (!reason || reason.length > 500)
      return Result.err(failure("validation"));
    const { tenantId } = args.principal;
    const found = await this.enrolments.find(tenantId, args.id);
    if (!found) return Result.err(failure("not_found"));
    const activity = await this.activities.find(tenantId, found.activityId);
    const enrolment = await this.enrolments.find(tenantId, args.id);
    if (!activity || !enrolment) return Result.err(failure("not_found"));
    if (enrolment.status !== "enrolled" && enrolment.status !== "waiting")
      return Result.ok();
    const now = this.clock.now();
    const removed = {
      ...enrolment,
      status: "removed" as const,
      endedAt: now,
      removalReason: reason,
    };
    await this.enrolments.save(removed);
    await this.notices.notify({
      enrolment: removed,
      kind: "enrolment_removed",
      now,
      details: { reason },
    });
    if (enrolment.status === "enrolled" && activity.status === "published")
      await this.queue.fill({
        tenantId,
        activityId: activity.id,
        places: activity.places,
        now,
      });
    await this.audit.record(
      args.principal,
      "activity_enrolment.removed",
      enrolment.id,
      { activityId: activity.id, reason },
    );
    return Result.ok();
  }
}
