// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
/** Every kind of notice, for the database checks, the API enums and the preferences. */
export const messageKinds = [
  "confirmed",
  "rescheduled",
  "cancelled",
  "cancelled_by_municipality",
  "reminder",
  "no_show",
  "blocked",
  "unblocked",
  "waitlist_offer",
  "enrolment_confirmed",
  "enrolment_waiting",
  "enrolment_promoted",
  "enrolment_removed",
  "activity_session_cancelled",
  "activity_cancelled",
] as const;
export type MessageKind = (typeof messageKinds)[number];
/**
 * Email and Web Push to the person, as they chose; webhook to the council's access-control
 * system when it has one.
 */
export type MessageChannel = "email" | "push" | "webhook";
/** Kinds that change whether a reservation opens the door. */
const doorKinds: MessageKind[] = [
  "confirmed",
  "rescheduled",
  "cancelled",
  "cancelled_by_municipality",
  "no_show",
];
/** Messages for delivery outside the transaction; they commit or roll back with the caller. */
export abstract class Outbox {
  /**
   * Returns false when a message with the same dedupe key already exists, when the person
   * switched this notice off for the channel (or, for push, has no device), or for a webhook
   * when the municipality has no access-control connector configured.
   */
  abstract enqueue(args: {
    id: string;
    tenantId: string;
    userId: string;
    /** A message is about a reservation, a waiting-list offer (#96) or an enrolment (#97). */
    bookingId: string | null;
    waitlistEntryId?: string | null;
    enrolmentId?: string | null;
    /** The cancelled date an enrolment notice is about. */
    activitySessionId?: string | null;
    kind: MessageKind;
    channel: MessageChannel;
    dedupeKey: string;
    createdAt: Temporal.Instant;
  }): Promise<boolean>;
}
/**
 * Queues the external effects of a booking change next to its in-app notice: email and push as
 * the person chose, and the access-control webhook when the change affects the door.
 */
export async function queueBookingChange(
  outbox: Outbox,
  args: {
    newId: () => string;
    tenantId: string;
    userId: string;
    bookingId: string;
    kind: MessageKind;
    notificationId: string;
    createdAt: Temporal.Instant;
  },
) {
  const channels: MessageChannel[] = doorKinds.includes(args.kind)
    ? ["email", "push", "webhook"]
    : ["email", "push"];
  for (const channel of channels)
    await outbox.enqueue({
      id: args.newId(),
      tenantId: args.tenantId,
      userId: args.userId,
      bookingId: args.bookingId,
      kind: args.kind,
      channel,
      // The email key predates the other channels and stays as it was.
      dedupeKey:
        channel === "email"
          ? `${args.kind}:${args.notificationId}`
          : `${args.kind}:${channel}:${args.notificationId}`,
      createdAt: args.createdAt,
    });
}
/** Email and push of a waiting-list offer (#96); an entry is offered once, so its id is the key. */
export async function queueWaitlistOffer(
  outbox: Outbox,
  args: {
    newId: () => string;
    tenantId: string;
    userId: string;
    entryId: string;
    createdAt: Temporal.Instant;
  },
) {
  for (const channel of ["email", "push"] as const)
    await outbox.enqueue({
      id: args.newId(),
      tenantId: args.tenantId,
      userId: args.userId,
      bookingId: null,
      waitlistEntryId: args.entryId,
      kind: "waitlist_offer",
      channel,
      dedupeKey: `waitlist_offer:${channel}:${args.entryId}`,
      createdAt: args.createdAt,
    });
}
/**
 * Email and push of a notice about an enrolment in an activity (#97). Activities have no door of
 * their own, so the access-control webhook is not told.
 */
export async function queueEnrolmentNotice(
  outbox: Outbox,
  args: {
    newId: () => string;
    tenantId: string;
    userId: string;
    enrolmentId: string;
    activitySessionId?: string | null;
    kind: MessageKind;
    notificationId: string;
    createdAt: Temporal.Instant;
  },
) {
  for (const channel of ["email", "push"] as const)
    await outbox.enqueue({
      id: args.newId(),
      tenantId: args.tenantId,
      userId: args.userId,
      bookingId: null,
      enrolmentId: args.enrolmentId,
      activitySessionId: args.activitySessionId ?? null,
      kind: args.kind,
      channel,
      dedupeKey: `${args.kind}:${channel}:${args.notificationId}`,
      createdAt: args.createdAt,
    });
}
