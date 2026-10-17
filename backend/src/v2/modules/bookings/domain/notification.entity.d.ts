// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export interface Notification {
  id: string;
  bookingId: string;
  kind: "confirmed" | "rescheduled" | "cancelled";
  facilityName: string;
  createdAt: Temporal.Instant;
}
