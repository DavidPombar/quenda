// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
/**
 * One booking, or one session of an activity the person is enrolled in (#97), as a
 * personal-calendar event. Carries no personal data.
 */
export interface CalendarEntry {
  /** RFC 5545 UID, stable across changes: `<booking>@quenda` or `<session>-<enrolment>@quenda`. */
  uid: string;
  /** Activity name for a session; null for a booking. */
  activityName: string | null;
  start: Temporal.Instant;
  end: Temporal.Instant;
  status: "confirmed" | "cancelled";
  /** RFC 5545 SEQUENCE: incremented by every reschedule or cancellation of the booking or session. */
  sequence: number;
  createdAt: Temporal.Instant;
  facilityName: string;
  /** Booked court or space; the facility's own name when it has a single one. */
  resourceName: string;
  facilityAddress: string;
  municipalityName: string;
}
export interface CalendarDocument {
  entries: CalendarEntry[];
  generatedAt: Temporal.Instant;
}
