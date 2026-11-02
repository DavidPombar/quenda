// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { ActivityRepository } from "../../domain/activity.repository";
import { ManagedActivityDetails } from "../../domain/activity.read-model";
import { ActivityInput, isEditable } from "../activity-input";
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
import { WaitlistOffers } from "../../../../shared/application/waitlist-offers";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type UpdateActivityError =
  | AppError<"forbidden">
  | AppError<"activity_not_editable">
  | PrepareActivityError;
/**
 * Changes an activity (#97). For a published one the sessions that have not started are replaced
 * by those of the new rule, checked again against the court; places it gives up may go to the
 * waiting lists (#96). Sessions already held stay as they were.
 */
@Injectable()
export class UpdateActivity {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly preparation: ActivityPreparation,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly audit: Audit,
    private readonly waitlist: WaitlistOffers,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    input: ActivityInput;
  }): Promise<Result<ManagedActivityDetails, UpdateActivityError>> {
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
    const prepared = (
      await this.preparation.prepare({
        activityId: activity.id,
        input: args.input,
        municipality,
        now,
      })
    ).fold<{ value: PreparedActivity } | { error: PrepareActivityError }>(
      (value) => ({ value }),
      (error) => ({ error }),
    );
    if ("error" in prepared) return Result.err(prepared.error);
    const { input, schedule, sessions, unitIds, facilityActive } =
      prepared.value;
    const published = activity.status === "published";
    if (published && !facilityActive)
      return Result.err(failure("resource_unavailable"));
    await this.activities.save({ ...activity, ...input, schedule });
    if (published) {
      const freed = await this.activities.replaceUpcomingSessions({
        tenantId,
        activityId: activity.id,
        from: now,
        unitIds,
        sessions: sessions.map((session) => ({
          id: this.ids.next(),
          ...session,
        })),
      });
      for (const interval of freed)
        await this.waitlist.offer({
          tenantId,
          facilityId: activity.facilityId,
          ...interval,
          now,
        });
    }
    await this.audit.record(args.principal, "activity.updated", activity.id, {
      facilityId: input.facilityId,
      resourceId: input.resourceId,
      name: input.name.gl,
      places: input.places,
      ...(published ? { dates: sessions.length } : {}),
    });
    const details = await this.activities.details(tenantId, activity.id, now);
    if (!details) return Result.err(failure("not_found"));
    return Result.ok(details);
  }
}
