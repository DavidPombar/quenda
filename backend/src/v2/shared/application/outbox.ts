// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export type MessageKind =
  | "confirmed"
  | "rescheduled"
  | "cancelled"
  | "cancelled_by_municipality"
  | "reminder"
  | "no_show";
/** Email to the person; webhook to the council's access-control system when it has one. */
export type MessageChannel = "email" | "webhook";
/** Messages for delivery outside the transaction; they commit or roll back with the caller. */
export abstract class Outbox {
  /**
   * Returns false when a message with the same dedupe key already exists, or for a webhook when
   * the municipality has no access-control connector configured.
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
 * Queues the external effects of a booking change next to its in-app notice: the email (unless
 * the change is not one people are emailed about) and the access-control webhook.
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
    email: boolean;
  },
) {
  const channels: MessageChannel[] = args.email
    ? ["email", "webhook"]
    : ["webhook"];
  for (const channel of channels)
    await outbox.enqueue({
      id: args.newId(),
      tenantId: args.tenantId,
      userId: args.userId,
      bookingId: args.bookingId,
      kind: args.kind,
      channel,
      dedupeKey:
        channel === "email"
          ? `${args.kind}:${args.notificationId}`
          : `${args.kind}:webhook:${args.notificationId}`,
      createdAt: args.createdAt,
    });
}
