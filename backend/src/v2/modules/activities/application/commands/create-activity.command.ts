// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { ActivityRepository } from "../../domain/activity.repository";
import { ManagedActivityDetails } from "../../domain/activity.read-model";
import { ActivityInput } from "../activity-input";
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
export type CreateActivityError = AppError<"forbidden"> | PrepareActivityError;
/**
 * Saves a new activity as a draft (#97). Its sessions must already fit the court: a draft that
 * clashes is not stored, so publishing later only has to check again for what changed meanwhile.
 */
@Injectable()
export class CreateActivity {
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
    input: ActivityInput;
  }): Promise<Result<ManagedActivityDetails, CreateActivityError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const municipality = await this.municipalities.find(
      args.principal.tenantId,
    );
    if (!municipality) return Result.err(failure("not_found"));
    const id = this.ids.next();
    const now = this.clock.now();
    const prepared = (
      await this.preparation.prepare({
        activityId: id,
        input: args.input,
        municipality,
        now,
      })
    ).fold<{ value: PreparedActivity } | { error: PrepareActivityError }>(
      (value) => ({ value }),
      (error) => ({ error }),
    );
    if ("error" in prepared) return Result.err(prepared.error);
    const { input, schedule } = prepared.value;
    await this.activities.save({
      id,
      tenantId: municipality.id,
      ...input,
      schedule,
      status: "draft",
      cancellationReason: null,
      createdAt: now,
      publishedAt: null,
      cancelledAt: null,
    });
    await this.audit.record(args.principal, "activity.created", id, {
      facilityId: input.facilityId,
      resourceId: input.resourceId,
      name: input.name.gl,
      places: input.places,
    });
    const details = await this.activities.details(municipality.id, id, now);
    if (!details) return Result.err(failure("not_found"));
    return Result.ok(details);
  }
}
