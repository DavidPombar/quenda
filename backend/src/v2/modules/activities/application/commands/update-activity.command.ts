// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { ActivityRepository } from "../../domain/activity.repository";
import { EnrolmentRepository } from "../../domain/enrolment.repository";
import type { Activity } from "../../domain/activity.entity";
import { ManagedActivityDetails } from "../../domain/activity.read-model";
import {
  ActivityInput,
  cleanActivityInput,
  isEditable,
} from "../activity-input";
import {
  ActivityPreparation,
  PrepareActivityError,
  PreparedActivity,
} from "../activity-preparation";
import { EnrolmentQueue } from "../enrolment-queue";
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
  | AppError<"activity_has_enrolments">
  | AppError<"places_below_enrolled">
  | PrepareActivityError;
/** Whether the input keeps the court, days, times and dates the sessions were made from. */
function sameSchedule(activity: Activity, input: ActivityInput) {
  return (
    activity.facilityId === input.facilityId &&
    activity.resourceId === input.resourceId &&
    activity.rule.startsLocal === input.rule.startsLocal &&
    activity.rule.endsLocal === input.rule.endsLocal &&
    activity.rule.startsOn === input.rule.startsOn &&
    activity.rule.endsOn === input.rule.endsOn &&
    activity.rule.weekdays.join() === input.rule.weekdays.join() &&
    activity.rule.exceptions.join() === input.rule.exceptions.join()
  );
}
/**
 * Changes an activity (#97). For a published one the sessions that have not started are replaced
 * by those of the new rule, checked again against the court; places it gives up may go to the
 * waiting lists (#96). Sessions already held stay as they were.
 *
 * Once someone has enrolled, their notices and calendars refer to its sessions: the court and
 * the rule stay as they are and dates are cancelled one by one instead. Places cannot drop below
 * the people enrolled, and new places go to the people waiting.
 */
@Injectable()
export class UpdateActivity {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly enrolments: EnrolmentRepository,
    private readonly preparation: ActivityPreparation,
    private readonly queue: EnrolmentQueue,
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
    const published = activity.status === "published";
    let saved: ActivityInput;
    let dates: number | undefined;
    if (await this.enrolments.hasAny(tenantId, activity.id)) {
      const input = cleanActivityInput(
        args.input,
        municipality.enabledCategories,
      );
      if (!input) return Result.err(failure("validation"));
      if (!sameSchedule(activity, input))
        return Result.err(failure("activity_has_enrolments"));
      const open = await this.enrolments.open(tenantId, activity.id);
      const enrolled = open.filter((entry) => entry.status === "enrolled");
      if (input.places < enrolled.length)
        return Result.err(failure("places_below_enrolled"));
      if (
        input.sport !== activity.sport &&
        !(await this.activities.sportExists(tenantId, input.sport))
      )
        return Result.err(failure("validation"));
      await this.activities.save({ ...activity, ...input });
      saved = input;
      if (published)
        await this.queue.fill({
          tenantId,
          activityId: activity.id,
          places: input.places,
          now,
        });
    } else {
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
      if (published && !facilityActive)
        return Result.err(failure("resource_unavailable"));
      await this.activities.save({ ...activity, ...input, schedule });
      saved = input;
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
        dates = sessions.length;
      }
    }
    await this.audit.record(args.principal, "activity.updated", activity.id, {
      facilityId: saved.facilityId,
      resourceId: saved.resourceId,
      name: saved.name.gl,
      places: saved.places,
      ...(dates === undefined ? {} : { dates }),
    });
    const details = await this.activities.details(tenantId, activity.id, now);
    if (!details) return Result.err(failure("not_found"));
    return Result.ok(details);
  }
}
