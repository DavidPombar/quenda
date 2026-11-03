// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export interface NotificationDetails {
  reason?: string;
  /** Until when a waiting-list offer holds the place (#96). */
  offerExpiresAt?: string;
  /** Start of each cancelled date of an activity (#97). */
  dates?: string[];
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
    | "waitlist_offer"
    | "enrolment_confirmed"
    | "enrolment_waiting"
    | "enrolment_promoted"
    | "enrolment_removed"
    | "activity_session_cancelled"
    | "activity_cancelled";
  /** Municipal reason or penalty standing at the time of the notice. */
  details: NotificationDetails | null;
  facilityName: string;
  resourceId: string;
  resourceName: string;
  /** The activity of an enrolment notice (#97). */
  activityId: string | null;
  activityName: { gl: string; es: string } | null;
  createdAt: Temporal.Instant;
}
