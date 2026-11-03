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
  /** The reservation, or null for a waiting-list offer (#96) or an enrolment notice (#97). */
  bookingId: string | null;
  waitlistEntryId: string | null;
  enrolmentId: string | null;
  /** Activity of an enrolment notice, and the state of that enrolment now. */
  activity: { name: { gl: string; es: string } } | null;
  enrolmentStatus:
    "enrolled" | "waiting" | "left" | "removed" | "cancelled" | null;
  /** First name of the person in the adult's care the enrolment is for (#97, part C). */
  participant: string | null;
  /** Reason and cancelled dates recorded in the enrolment notice. */
  noticeReason: string | null;
  cancelledDates: Temporal.Instant[];
  attempts: number;
  /** NULL when the account has no address or has been deleted. */
  email: string | null;
  locale: "gl" | "es";
  bookingStatus: "confirmed" | "cancelled" | "no_show" | null;
  /** Until when an offer holds the place, and whether it is still open now. */
  offerExpiresAt: Temporal.Instant | null;
  offerOpen: boolean;
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
  /** The reservation, the offered slot, or for an enrolment the session it is about. */
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
