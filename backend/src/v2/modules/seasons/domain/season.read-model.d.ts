// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
/** Code from the municipality's sports catalogue (#26). */
export type Sport = string;
export interface Representative {
  userId: string;
  displayName: string;
  email: string | null;
}
/** A club, school or association registered by the manager (#17). */
export interface Organization {
  id: string;
  name: string;
  taxId: string | null;
  sport: Sport | null;
  contactEmail: string | null;
  createdAt: Temporal.Instant;
  archivedAt: Temporal.Instant | null;
  representatives: Representative[];
}
export interface Campaign {
  id: string;
  name: string;
  /** ISO calendar dates, inclusive, in the municipality's time zone. */
  startsOn: string;
  endsOn: string;
  criteria: { gl: string; es: string };
  facilityIds: string[];
  createdAt: Temporal.Instant;
}
export interface SeasonConflict {
  occurrenceId: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
  /** The one-off booking kept on that date, or null when another club holds it. */
  bookingId: string | null;
}
export interface Allocation {
  id: string;
  campaignId: string;
  organizationId: string;
  organizationName: string;
  facilityId: string;
  facilityName: string;
  resourceId: string;
  resourceName: string;
  /** ISO weekdays, 1 = Monday. */
  weekdays: number[];
  /** Local times, HH:MM. */
  startsLocal: string;
  endsLocal: string;
  reason: string;
  createdAt: Temporal.Instant;
  cancelledAt: Temporal.Instant | null;
  cancellationReason: string | null;
  active: number;
  cancelled: number;
  conflicts: SeasonConflict[];
  /** Upcoming dates still held, so one can be freed. */
  dates: { id: string; start: Temporal.Instant; end: Temporal.Instant }[];
}
export interface ClubOccurrence {
  id: string;
  facilityName: string;
  resourceName: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
}
export interface MyClub {
  organization: { id: string; name: string; sport: Sport | null } | null;
  occurrences: ClubOccurrence[];
}
