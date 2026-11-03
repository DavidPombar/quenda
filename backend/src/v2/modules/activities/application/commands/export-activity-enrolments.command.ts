// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { ActivityRepository } from "../../domain/activity.repository";
import { EnrolmentRepository } from "../../domain/enrolment.repository";
import type { Activity } from "../../domain/activity.entity";
import type { ManagedEnrolment } from "../../domain/enrolment.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export interface EnrolmentExport {
  activity: Pick<Activity, "id" | "name">;
  /** The municipality's time zone, for the dates. */
  timezone: string;
  enrolments: ManagedEnrolment[];
}
/**
 * The people enrolled in an activity, for the municipality's CSV (#97). A command because it
 * hands out personal data: every download is recorded in the audit log (T4).
 */
@Injectable()
export class ExportActivityEnrolments {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly enrolments: EnrolmentRepository,
    private readonly municipalities: Municipalities,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    activityId: string;
  }): Promise<
    Result<EnrolmentExport, AppError<"forbidden"> | AppError<"not_found">>
  > {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    const municipality = await this.municipalities.find(tenantId);
    const activity = await this.activities.find(tenantId, args.activityId);
    if (!municipality || !activity) return Result.err(failure("not_found"));
    const enrolments = await this.enrolments.all(tenantId, activity.id);
    await this.audit.record(
      args.principal,
      "activity.enrolments_exported",
      activity.id,
      { rows: enrolments.length },
    );
    return Result.ok({
      activity: { id: activity.id, name: activity.name },
      timezone: municipality.timezone,
      enrolments,
    });
  }
}
