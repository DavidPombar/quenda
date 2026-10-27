// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type {
  MessageChannel,
  MessageKind,
} from "../../../shared/application/outbox";
/** An outbox message resolved for delivery, with the data needed to write it. */
export interface Delivery {
  id: string;
  kind: MessageKind;
  channel: MessageChannel;
  tenantId: string;
  userId: string;
  bookingId: string;
  attempts: number;
  /** NULL when the account has no address or has been deleted. */
  email: string | null;
  locale: "gl" | "es";
  bookingStatus: "confirmed" | "cancelled";
  municipality: {
    slug: string;
    name: string;
    timezone: string;
    senderName: string;
    replyTo: string;
  };
  facility: { name: string; address: string };
  start: Temporal.Instant;
  end: Temporal.Instant;
}
export interface DueReminder {
  bookingId: string;
  userId: string;
  dedupeKey: string;
}
