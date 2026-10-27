// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
/** Public half of a signing key as a JSON Web Key (EC P-256). */
export type PublicJwk = Record<string, string>;
export interface AccessKey {
  kid: string;
  publicJwk: PublicJwk;
  createdAt: Temporal.Instant;
  retiredAt: Temporal.Instant | null;
}
export interface AccessKeyRecord extends AccessKey {
  privateKeySealed: string;
}
/** What a pass is issued for; only the person's own reservation qualifies. */
export interface PassTarget {
  bookingId: string;
  facilityId: string;
  status: "confirmed" | "cancelled" | "no_show";
  start: Temporal.Instant;
  end: Temporal.Instant;
  openingCalendar: string;
}
export interface AccessPass {
  token: string;
  /** Short code staff can read out or type when the camera is unavailable. */
  code: string;
  validFrom: Temporal.Instant;
  validUntil: Temporal.Instant;
}
export interface AccessDayBooking {
  id: string;
  code: string;
  facilityId: string;
  facilityName: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
  status: "confirmed" | "cancelled" | "no_show";
  /** First name only; the door needs no more than that. */
  holder: string;
  checkedInAt: Temporal.Instant | null;
}
export interface AccessDay {
  date: Temporal.PlainDate;
  syncedAt: Temporal.Instant;
  issuer: string;
  keys: AccessKey[];
  bookings: AccessDayBooking[];
  /** Reservations that must no longer open the door even with a valid signature. */
  revoked: string[];
}
export type CheckInOutcome =
  | "recorded"
  | "duplicate"
  | "cancelled"
  | "no_show"
  | "out_of_window"
  | "not_found";
export interface AccessSettings {
  webhookUrl: string;
  hasWebhookSecret: boolean;
  keys: AccessKey[];
}
