// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { ActivityRepository } from "../../domain/activity.repository";
import { ManagedActivityDetails } from "../../domain/activity.read-model";
import { inputOf, isEditable } from "../activity-input";
import {
  ActivityPreparation,
  PrepareActivityError,
  PreparedActivity,
} from "../activity-preparation";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type PublishActivityError =
  | AppError<"forbidden">
  | AppError<"activity_not_editable">
  | PrepareActivityError;
/**
 * Publishes a draft (#97): it appears in the catalogue and each of its sessions occupies the court
 * like a club's season slot, so nobody can book it. The sessions are checked again first.
 */
@Injectable()
export class PublishActivity {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly preparation: ActivityPreparation,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
  }): Promise<Result<ManagedActivityDetails, PublishActivityError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    const municipality = await this.municipalities.find(tenantId);
    const activity = await this.activities.find(tenantId, args.id);
    if (!municipality || !activity) return Result.err(failure("not_found"));
    const now = this.clock.now();
    const today = now.toZonedDateTimeISO(municipality.timezone).toPlainDate();
    if (!isEditable(activity, today))
      return Result.err(failure("activity_not_editable"));
    if (activity.status === "draft") {
      const prepared = (
        await this.preparation.prepare({
          activityId: activity.id,
          input: inputOf(activity),
          municipality,
          now,
        })
      ).fold<{ value: PreparedActivity } | { error: PrepareActivityError }>(
        (value) => ({ value }),
        (error) => ({ error }),
      );
      if ("error" in prepared) return Result.err(prepared.error);
      const { schedule, sessions, unitIds, facilityActive } = prepared.value;
      if (!facilityActive) return Result.err(failure("resource_unavailable"));
      await this.activities.save({
        ...activity,
        schedule,
        status: "published",
        publishedAt: now,
      });
      await this.activities.replaceUpcomingSessions({
        tenantId,
        activityId: activity.id,
        from: now,
        unitIds,
        sessions: sessions.map((session) => ({
          id: this.ids.next(),
          ...session,
        })),
      });
      await this.audit.record(
        args.principal,
        "activity.published",
        activity.id,
        { dates: sessions.length },
      );
    }
    const details = await this.activities.details(tenantId, activity.id, now);
    if (!details) return Result.err(failure("not_found"));
    return Result.ok(details);
  }
}
