// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
/**
 * `enrolled` holds a place and `waiting` queues for one, in order of arrival; the others are
 * closed: the person left, the municipality removed them, or the activity was cancelled.
 */
export type EnrolmentStatus =
  "enrolled" | "waiting" | "left" | "removed" | "cancelled";
/** A person's enrolment in an activity (#97). */
export interface ActivityEnrolment {
  id: string;
  tenantId: string;
  activityId: string;
  userId: string;
  status: EnrolmentStatus;
  createdAt: Temporal.Instant;
  enrolledAt: Temporal.Instant | null;
  endedAt: Temporal.Instant | null;
  removalReason: string | null;
}
