// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { CalendarEntry } from "./calendar-entry.read-model";
export abstract class CalendarEntryRepository {
  abstract find(
    tenantId: string,
    userId: string,
    bookingId: string,
  ): Promise<CalendarEntry | null>;
  abstract listEndingAfter(
    tenantId: string,
    userId: string,
    since: Temporal.Instant,
  ): Promise<CalendarEntry[]>;
}
