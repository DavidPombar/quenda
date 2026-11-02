// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import type { Temporal } from "@js-temporal/polyfill";
import { ActivityRepository } from "../domain/activity.repository";
import type { SessionClash } from "../domain/activity-schedule";
import { ActivityInput, cleanActivityInput } from "./activity-input";
import { ActivityPlanner } from "./activity-planner";
import type { MunicipalitySettings } from "../../../shared/application/municipality-settings";
import { Result } from "../../../shared/application/result";
import { AppError, failure } from "../../../shared/application/errors";
export type ActivityConflict = AppError<"activity_conflict"> & {
  clashes: SessionClash[];
};
export type PrepareActivityError =
  | AppError<"not_found">
  | AppError<"validation">
  | AppError<"resource_unavailable">
  | ActivityConflict;
export interface PreparedActivity {
  input: ActivityInput;
  schedule: string;
  sessions: { start: Temporal.Instant; end: Temporal.Instant }[];
  unitIds: string[];
  /** Whether the facility takes reservations now; only then can the activity be published. */
  facilityActive: boolean;
}
/**
 * Checks an activity as the manager wrote it against the municipality: a visible sport, a court
 * of the facility in service and sessions that fit (#97). Takes the facility lock, so nothing can
 * take the court between this check and storing the sessions.
 */
@Injectable()
export class ActivityPreparation {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly planner: ActivityPlanner,
  ) {}
  async prepare(args: {
    activityId: string;
    input: ActivityInput;
    municipality: MunicipalitySettings;
    now: Temporal.Instant;
  }): Promise<Result<PreparedActivity, PrepareActivityError>> {
    const { municipality } = args;
    const input = cleanActivityInput(
      args.input,
      municipality.enabledCategories,
    );
    if (!input) return Result.err(failure("validation"));
    if (!(await this.activities.sportExists(municipality.id, input.sport)))
      return Result.err(failure("validation"));
    const facility = await this.activities.lockFacility(
      municipality.id,
      input.facilityId,
    );
    if (!facility) return Result.err(failure("not_found"));
    const resources = await this.activities.resources(
      municipality.id,
      facility.id,
    );
    const resource = resources.find((item) => item.id === input.resourceId);
    if (!resource) return Result.err(failure("not_found"));
    if (!resource.active) return Result.err(failure("resource_unavailable"));
    const plan = await this.planner.plan({
      activityId: args.activityId,
      rule: input.rule,
      facility,
      resource,
      resources,
      municipality,
      now: args.now,
    });
    switch (plan.kind) {
      case "invalid":
        return Result.err(failure("validation"));
      case "clashes":
        return Result.err({
          ...failure("activity_conflict"),
          clashes: plan.clashes,
        });
      case "ok":
        return Result.ok({
          input,
          schedule: plan.schedule,
          sessions: plan.sessions,
          unitIds: plan.unitIds,
          facilityActive: facility.status === "active",
        });
    }
  }
}
