// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export type MessageKind =
  | "confirmed"
  | "rescheduled"
  | "cancelled"
  | "cancelled_by_municipality"
  | "reminder"
  | "no_show"
  | "blocked"
  | "unblocked";
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
    bookingId: string;
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
