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
  bookingStatus: "confirmed" | "cancelled" | "no_show";
  municipality: {
    slug: string;
    name: string;
    timezone: string;
    senderName: string;
    replyTo: string;
  };
  facility: { name: string; address: string };
  /** Access-control connector of the municipality, when configured. */
  webhook: { url: string; secretSealed: string } | null;
  facilityId: string;
  openingCalendar: string;
  /** The person's stored choice for this notice and channel; NULL means the default. */
  preference: boolean | null;
  /** When that choice last changed, in epoch milliseconds ("0" if never); signs unsubscribe links. */
  preferenceVersion: string;
  /** Penalty standing shown with no-show and block notices, as recorded in the in-app notice. */
  standing: PenaltyStanding | null;
  /** Reason given by the municipality when it cancelled the reservation. */
  cancellationReason: string | null;
  start: Temporal.Instant;
  end: Temporal.Instant;
}
export interface PenaltyStanding {
  count: number;
  limit: number;
  remaining: number;
  blockedUntil: string | null;
}
/** A browser that accepted push notices from the person. */
export interface PushDevice {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}
export interface DueReminder {
  bookingId: string;
  userId: string;
  dedupeKey: string;
}
