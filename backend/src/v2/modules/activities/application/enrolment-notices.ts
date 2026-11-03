// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import type { Temporal } from "@js-temporal/polyfill";
import {
  MessageKind,
  Outbox,
  queueEnrolmentNotice,
} from "../../../shared/application/outbox";
import { IdGenerator } from "../../../shared/application/id-generator";
import { NotificationRepository } from "../../bookings/domain/notification.repository";
import type { NotificationDetails } from "../../bookings/domain/notification.entity";
import { EnrolmentRepository } from "../domain/enrolment.repository";
import type { ActivityEnrolment } from "../domain/enrolment.entity";
type EnrolmentKind = Extract<
  MessageKind,
  | "enrolment_confirmed"
  | "enrolment_waiting"
  | "enrolment_promoted"
  | "enrolment_removed"
  | "activity_session_cancelled"
  | "activity_cancelled"
>;
/**
 * The in-app notice of an enrolment change and its email and push, committed with the change
 * (#97).
 */
@Injectable()
export class EnrolmentNotices {
  constructor(
    private readonly enrolments: EnrolmentRepository,
    private readonly notifications: NotificationRepository,
    private readonly outbox: Outbox,
    private readonly ids: IdGenerator,
  ) {}
  async notify(args: {
    enrolment: ActivityEnrolment;
    kind: EnrolmentKind;
    now: Temporal.Instant;
    activitySessionId?: string;
    details?: NotificationDetails;
    /** Makes the notice unique, so a repeated cancellation tells nobody twice. */
    dedupeKey?: string;
  }) {
    const { enrolment } = args;
    const notificationId = this.ids.next();
    const added = await this.notifications.add({
      id: notificationId,
      tenantId: enrolment.tenantId,
      userId: enrolment.userId,
      bookingId: null,
      enrolmentId: enrolment.id,
      activitySessionId: args.activitySessionId,
      kind: args.kind,
      createdAt: args.now,
      details: args.details,
      dedupeKey: args.dedupeKey,
    });
    if (!added) return;
    await queueEnrolmentNotice(this.outbox, {
      newId: () => this.ids.next(),
      tenantId: enrolment.tenantId,
      userId: enrolment.userId,
      enrolmentId: enrolment.id,
      activitySessionId: args.activitySessionId,
      kind: args.kind,
      notificationId,
      createdAt: args.now,
    });
  }
  /** One notice per enrolled person and activity, listing every date cancelled at once. */
  async sessionsCancelled(args: {
    tenantId: string;
    sessionIds: readonly string[];
    reason: string;
    now: Temporal.Instant;
  }) {
    const sessions = await this.enrolments.sessions(
      args.tenantId,
      args.sessionIds,
    );
    const byActivity = new Map<string, typeof sessions>();
    for (const session of sessions)
      byActivity.set(session.activityId, [
        ...(byActivity.get(session.activityId) ?? []),
        session,
      ]);
    for (const [activityId, dates] of byActivity) {
      const [first] = dates;
      if (!first) continue;
      for (const enrolment of await this.enrolments.open(
        args.tenantId,
        activityId,
      )) {
        if (enrolment.status !== "enrolled") continue;
        await this.notify({
          enrolment,
          kind: "activity_session_cancelled",
          now: args.now,
          activitySessionId: first.id,
          details: {
            reason: args.reason,
            dates: dates.map((date) => date.start.toString()),
          },
          dedupeKey: `activity_session_cancelled:${enrolment.id}:${first.id}`,
        });
      }
    }
  }
}
