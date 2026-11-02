// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { TariffCategory } from "../../../shared/application/categories";
export type ActivityStatus = "draft" | "published" | "cancelled";
export interface LocalizedText {
  gl: string;
  /** Empty means use the Galician text. */
  es: string;
}
/** The weekly rule as the manager edits it; times are local to the municipality. */
export interface WeeklyRule {
  /** ISO weekdays, 1 = Monday, ascending. */
  weekdays: number[];
  /** HH:MM */
  startsLocal: string;
  endsLocal: string;
  /** ISO calendar dates, inclusive. */
  startsOn: string;
  endsOn: string;
  /** Dates without a session, ascending. */
  exceptions: string[];
}
export interface ActivityPrice {
  category: TariffCategory;
  priceCents: number;
}
/** A course or sports school with places on one court or lane (#97). */
export interface Activity {
  id: string;
  tenantId: string;
  facilityId: string;
  resourceId: string;
  sport: string;
  name: LocalizedText;
  description: LocalizedText;
  rule: WeeklyRule;
  /** RFC 5545 VCALENDAR equivalent of the rule (RRULE + EXDATE). */
  schedule: string;
  places: number;
  minAge: number | null;
  maxAge: number | null;
  /** ISO calendar dates, inclusive. */
  enrolmentOpensOn: string;
  enrolmentClosesOn: string;
  prices: ActivityPrice[];
  status: ActivityStatus;
  cancellationReason: string | null;
  createdAt: Temporal.Instant;
  publishedAt: Temporal.Instant | null;
  cancelledAt: Temporal.Instant | null;
}
export interface ActivitySession {
  id: string;
  activityId: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
  status: "active" | "cancelled";
  cancellationReason: string | null;
}
