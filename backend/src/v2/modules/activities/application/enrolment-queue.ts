// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import type { Temporal } from "@js-temporal/polyfill";
import { ActivityEnrolments } from "../../../shared/application/activity-enrolments";
import { ActivityRepository } from "../domain/activity.repository";
import { EnrolmentRepository } from "../domain/enrolment.repository";
import { promotions } from "../domain/enrolment-queue";
import { EnrolmentNotices } from "./enrolment-notices";
/**
 * Fills the free places of an activity from its waiting list, oldest first, telling each person
 * (#97); also the port other modules use to cancel dates or remove people.
 */
@Injectable()
export class EnrolmentQueue extends ActivityEnrolments {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly enrolments: EnrolmentRepository,
    private readonly notices: EnrolmentNotices,
  ) {
    super();
  }
  /** The caller holds the activity's lock. Returns how many people moved up. */
  async fill(args: {
    tenantId: string;
    activityId: string;
    places: number;
    now: Temporal.Instant;
  }): Promise<number> {
    const open = await this.enrolments.open(args.tenantId, args.activityId);
    const enrolled = open.filter((entry) => entry.status === "enrolled").length;
    const moved = promotions(
      args.places,
      enrolled,
      open.filter((entry) => entry.status === "waiting"),
    );
    for (const entry of moved) {
      const promoted = {
        ...entry,
        status: "enrolled" as const,
        enrolledAt: args.now,
      };
      await this.enrolments.save(promoted);
      await this.notices.notify({
        enrolment: promoted,
        kind: "enrolment_promoted",
        now: args.now,
      });
    }
    return moved.length;
  }
  sessionsCancelled(
    args: Parameters<ActivityEnrolments["sessionsCancelled"]>[0],
  ) {
    return this.notices.sessionsCancelled(args);
  }
  async forget(tenantId: string, userId: string, now: Temporal.Instant) {
    const activityIds = new Set(
      (await this.enrolments.openOfUser(tenantId, userId)).map(
        (entry) => entry.activityId,
      ),
    );
    for (const activityId of activityIds) {
      const activity = await this.activities.find(tenantId, activityId);
      const entry = await this.enrolments.findOpen(
        tenantId,
        activityId,
        userId,
      );
      if (!activity || !entry) continue;
      await this.enrolments.save({ ...entry, status: "left", endedAt: now });
      if (activity.status === "published")
        await this.fill({ tenantId, activityId, places: activity.places, now });
    }
  }
}
