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
  facilityId: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
  /** `season`: an active occurrence of a club's season slot (#17). */
  status: "confirmed" | "cancelled" | "no_show" | "season";
}
export abstract class InsightsRepository {
  abstract facilities(tenantId: string): Promise<InsightsFacility[]>;
  abstract statusPeriods(
    tenantId: string,
    start: Temporal.Instant,
    end: Temporal.Instant,
  ): Promise<StatusPeriod[]>;
  /** Bookings overlapping start–end, whatever their status. */
  abstract bookings(
    tenantId: string,
    start: Temporal.Instant,
    end: Temporal.Instant,
  ): Promise<BookingSpan[]>;
}
