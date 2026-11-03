// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { ActivityRepository } from "../../domain/activity.repository";
import { EnrolmentRepository } from "../../domain/enrolment.repository";
import { DependantRepository } from "../../domain/dependant.repository";
import { ageInYear, fitsAges } from "../../domain/guardianship";
import type { ActivityEnrolment } from "../../domain/enrolment.entity";
import type { MyEnrolment } from "../../domain/enrolment.read-model";
import { enrolmentState } from "../activity-input";
import { EnrolmentNotices } from "../enrolment-notices";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type EnrolInActivityError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"enrolment_closed">
  | AppError<"age_not_allowed">
  | AppError<"already_enrolled">
  | AppError<"id_reused">;
/** Adults enrol themselves when an activity's top age reaches adulthood, or it has none. */
const ADULT_AGE = 18;
/**
 * Enrols the adult, or a person in their care, in a published activity while its enrolment period
 * is open (#97). A person in their care must have the age the activity asks for in the year it
 * starts. With no place left they join its waiting list, in order of arrival, and move up on
 * their own.
 */
@Injectable()
export class EnrolInActivity {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly enrolments: EnrolmentRepository,
    private readonly dependants: DependantRepository,
    private readonly notices: EnrolmentNotices,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    activityId: string;
    /** A person in the adult's care; the adult takes part when it is missing. */
    dependantId?: string | null;
  }): Promise<Result<MyEnrolment, EnrolInActivityError>> {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    const municipality = await this.municipalities.find(tenantId);
    // The activity's lock orders every change to its places.
    const activity = await this.activities.find(tenantId, args.activityId);
    if (!municipality || !activity || activity.status === "draft")
      return Result.err(failure("not_found"));
    const existing = await this.enrolments.find(tenantId, args.id);
    const now = this.clock.now();
    if (existing)
      return existing.userId === userId && existing.activityId === activity.id
        ? this.mine(tenantId, userId, existing.id, now)
        : Result.err(failure("id_reused"));
    const today = now.toZonedDateTimeISO(municipality.timezone).toPlainDate();
    if (
      activity.status !== "published" ||
      enrolmentState(activity, today) !== "open"
    )
      return Result.err(failure("enrolment_closed"));
    const dependantId = args.dependantId ?? null;
    if (dependantId) {
      const dependant = await this.dependants.find(
        tenantId,
        userId,
        dependantId,
      );
      if (!dependant) return Result.err(failure("not_found"));
      const year = Temporal.PlainDate.from(activity.rule.startsOn).year;
      if (!fitsAges(ageInYear(dependant.birthYear, year), activity))
        return Result.err(failure("age_not_allowed"));
    } else if (activity.maxAge !== null && activity.maxAge < ADULT_AGE)
      return Result.err(failure("age_not_allowed"));
    if (
      await this.enrolments.findOpen(tenantId, activity.id, userId, dependantId)
    )
      return Result.err(failure("already_enrolled"));
    const open = await this.enrolments.open(tenantId, activity.id);
    const enrolled = open.filter((entry) => entry.status === "enrolled").length;
    const hasPlace = enrolled < activity.places;
    const enrolment: ActivityEnrolment = {
      id: args.id,
      tenantId,
      activityId: activity.id,
      userId,
      dependantId,
      status: hasPlace ? "enrolled" : "waiting",
      createdAt: now,
      enrolledAt: hasPlace ? now : null,
      endedAt: null,
      removalReason: null,
    };
    await this.enrolments.add(enrolment);
    await this.notices.notify({
      enrolment,
      kind: hasPlace ? "enrolment_confirmed" : "enrolment_waiting",
      now,
    });
    await this.audit.record(
      args.principal,
      "activity_enrolment.created",
      enrolment.id,
      {
        activityId: activity.id,
        status: enrolment.status,
        ...(dependantId ? { dependantId } : {}),
      },
    );
    return this.mine(tenantId, userId, enrolment.id, now);
  }
  private async mine(
    tenantId: string,
    userId: string,
    id: string,
    now: ReturnType<Clock["now"]>,
  ): Promise<Result<MyEnrolment, EnrolInActivityError>> {
    const found = (await this.enrolments.mine(tenantId, userId, now)).find(
      (entry) => entry.id === id,
    );
    return found ? Result.ok(found) : Result.err(failure("not_found"));
  }
}
