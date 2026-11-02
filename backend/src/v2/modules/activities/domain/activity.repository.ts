// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { Activity, ActivitySession } from "./activity.entity";
import type { ClashReason } from "./activity-schedule";
import type {
  ManagedActivity,
  ManagedActivityDetails,
  PublicActivity,
  PublicActivityDetails,
} from "./activity.read-model";
export const ACTIVITY_PAGE_SIZE = 12;
export const MAX_ACTIVITY_PAGE_SIZE = 48;
export interface ActivityFacility {
  id: string;
  status: "active" | "maintenance" | "closed";
  openingCalendar: string;
  followsMunicipalHolidays: boolean;
}
export interface ActivityResource {
  id: string;
  parentId: string | null;
  active: boolean;
}
export interface ActivityFilters {
  sport?: string;
  facilityId?: string;
  /** Age a person has or will have: activities without limits or whose limits include it. */
  age?: number;
  /** Only activities whose enrolment period includes `today`. */
  openOnly?: boolean;
}
export abstract class ActivityRepository {
  /** Locks the facility row, serialising with bookings, season slots and schedule edits. */
  abstract lockFacility(
    tenantId: string,
    facilityId: string,
  ): Promise<ActivityFacility | null>;
  abstract resources(
    tenantId: string,
    facilityId: string,
  ): Promise<ActivityResource[]>;
  /** Whether the code is a visible sport of the municipality's catalogue (#26). */
  abstract sportExists(tenantId: string, code: string): Promise<boolean>;
  /** Locks and returns the activity; null when it does not exist in the municipality. */
  abstract find(tenantId: string, id: string): Promise<Activity | null>;
  /** Inserts or replaces the activity and its prices. */
  abstract save(activity: Activity): Promise<void>;
  /**
   * For each interval, what already holds one of the units at that time, ignoring the activity's
   * own sessions. Returns the indexes of the clashing intervals.
   */
  abstract clashes(args: {
    tenantId: string;
    unitIds: readonly string[];
    intervals: readonly { start: Temporal.Instant; end: Temporal.Instant }[];
    activityId: string;
  }): Promise<{ index: number; reason: Exclude<ClashReason, "closed"> }[]>;
  /**
   * Replaces the sessions that start after `from` (and frees their units) with new ones that
   * occupy `unitIds`. Returns the intervals removed, so waiting lists can take them.
   */
  abstract replaceUpcomingSessions(args: {
    tenantId: string;
    activityId: string;
    from: Temporal.Instant;
    unitIds: readonly string[];
    sessions: readonly {
      id: string;
      start: Temporal.Instant;
      end: Temporal.Instant;
    }[];
  }): Promise<{ start: Temporal.Instant; end: Temporal.Instant }[]>;
  /** Locks and returns a session with its activity's facility and status. */
  abstract findSession(
    tenantId: string,
    id: string,
  ): Promise<
    | (ActivitySession & {
        facilityId: string;
        activityStatus: Activity["status"];
      })
    | null
  >;
  /** Cancels the given active sessions and frees their units. Returns the ones cancelled. */
  abstract cancelSessions(args: {
    tenantId: string;
    activityId: string;
    from: Temporal.Instant;
    reason: string;
    ids?: readonly string[];
  }): Promise<{ start: Temporal.Instant; end: Temporal.Instant }[]>;
  abstract list(
    tenantId: string,
    now: Temporal.Instant,
  ): Promise<ManagedActivity[]>;
  abstract details(
    tenantId: string,
    id: string,
    now: Temporal.Instant,
  ): Promise<ManagedActivityDetails | null>;
  /** Published activities that have not ended, ordered by first session and name. */
  abstract search(args: {
    tenantId: string;
    filters: ActivityFilters;
    today: string;
    now: Temporal.Instant;
    page: number;
    size: number;
  }): Promise<{ items: Omit<PublicActivity, "enrolment">[]; total: number }>;
  abstract publicDetails(
    tenantId: string,
    id: string,
    now: Temporal.Instant,
  ): Promise<Omit<PublicActivityDetails, "enrolment"> | null>;
}
