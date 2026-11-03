// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export interface InsightsFacility {
  id: string;
  name: string;
  sport: string;
  status: string;
  openingCalendar: string;
  followsMunicipalHolidays: boolean;
  unitIds: string[];
  /** Places of each active shared unit (#95). */
  capacities: Record<string, number>;
  /** Courts in service with their active units (a whole court's are its parts). */
  resources: {
    id: string;
    name: string;
    parentId: string | null;
    unitIds: string[];
  }[];
  hasStatusHistory: boolean;
}
export interface StatusPeriod {
  facilityId: string;
  status: string;
  start: Temporal.Instant;
  /** Null while the period is still current. */
  end: Temporal.Instant | null;
}
export interface BookingSpan {
  unitIds: string[];
  resourceId: string;
  facilityId: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
  /**
   * `season`: an active occurrence of a club's season slot (#17); `activity`: an active session of
   * a municipal activity (#97).
   */
  status: "confirmed" | "cancelled" | "no_show" | "season" | "activity";
}
/** One activity's figures over a range of sessions (#97, part D); counts only, no people. */
export interface ActivityFigures {
  id: string;
  name: string;
  facilityName: string;
  places: number;
  enrolled: number;
  waiting: number;
  /** Sessions in the range that took place, and those cancelled. */
  sessions: number;
  cancelledSessions: number;
  present: number;
  absent: number;
}
export abstract class InsightsRepository {
  abstract facilities(tenantId: string): Promise<InsightsFacility[]>;
  abstract statusPeriods(
    tenantId: string,
    start: Temporal.Instant,
    end: Temporal.Instant,
  ): Promise<StatusPeriod[]>;
  /** Waiting-list offers accepted and expired on slots of the local dates from–to (#96). */
  abstract waitlistOutcomes(
    tenantId: string,
    from: Temporal.PlainDate,
    to: Temporal.PlainDate,
  ): Promise<{ accepted: number; expired: number }>;
  /** Published or cancelled activities with sessions starting in start–end. */
  abstract activities(
    tenantId: string,
    start: Temporal.Instant,
    end: Temporal.Instant,
  ): Promise<ActivityFigures[]>;
  /** Bookings overlapping start–end, whatever their status. */
  abstract bookings(
    tenantId: string,
    start: Temporal.Instant,
    end: Temporal.Instant,
  ): Promise<BookingSpan[]>;
}
