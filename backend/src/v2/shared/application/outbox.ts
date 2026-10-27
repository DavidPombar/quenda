// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export type MessageKind =
  | "confirmed"
  | "rescheduled"
  | "cancelled"
  | "cancelled_by_municipality"
  | "reminder";
export type MessageChannel = "email";
/** Messages for delivery outside the transaction; they commit or roll back with the caller. */
export abstract class Outbox {
  /** Returns false when a message with the same dedupe key already exists. */
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
