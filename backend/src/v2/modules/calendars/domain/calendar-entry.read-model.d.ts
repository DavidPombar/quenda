// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
/** One booking as a personal-calendar event. Carries no personal data. */
export interface CalendarEntry {
  bookingId: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
  status: "confirmed" | "cancelled";
  /** RFC 5545 SEQUENCE: incremented by every reschedule or cancellation. */
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
