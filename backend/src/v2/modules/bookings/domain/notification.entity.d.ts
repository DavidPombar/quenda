// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export interface NotificationDetails {
  reason?: string;
  standing?: {
    count: number;
    limit: number;
    windowDays: number;
    blockDays: number;
    remaining: number;
    blockedUntil: string | null;
  };
}
export interface Notification {
  id: string;
  bookingId: string;
  kind:
    | "confirmed"
    | "rescheduled"
    | "cancelled"
    | "cancelled_by_municipality"
    | "no_show"
    | "blocked"
    | "unblocked";
  /** Municipal reason or penalty standing at the time of the notice. */
  details: NotificationDetails | null;
  facilityName: string;
  createdAt: Temporal.Instant;
}
