// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
/**
 * Enrolments in activities (#97) as seen by commands outside the activities module that cancel
 * their sessions (closing a facility) or remove people (account deletion). Each call runs in the
 * caller's transaction, so the notices and the places given on commit with that change.
 */
export abstract class ActivityEnrolments {
  /** Tells each person enrolled in the sessions' activities which of its dates were cancelled. */
  abstract sessionsCancelled(args: {
    tenantId: string;
    sessionIds: readonly string[];
    reason: string;
    now: Temporal.Instant;
  }): Promise<void>;
  /** Ends a person's open enrolments and gives their places to the people waiting. */
  abstract forget(
    tenantId: string,
    userId: string,
    now: Temporal.Instant,
  ): Promise<void>;
}
