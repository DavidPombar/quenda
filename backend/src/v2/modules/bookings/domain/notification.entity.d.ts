// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export interface NotificationDetails {
  reason?: string;
  /** Until when a waiting-list offer holds the place (#96). */
  offerExpiresAt?: string;
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
  /** Null for a waiting-list offer, which has no reservation yet. */
  bookingId: string | null;
  kind:
    | "confirmed"
    | "rescheduled"
    | "cancelled"
    | "cancelled_by_municipality"
    | "no_show"
    | "blocked"
    | "unblocked"
    | "reminder"
    | "waitlist_offer";
  /** Municipal reason or penalty standing at the time of the notice. */
  details: NotificationDetails | null;
  facilityName: string;
  resourceId: string;
  resourceName: string;
  createdAt: Temporal.Instant;
}
