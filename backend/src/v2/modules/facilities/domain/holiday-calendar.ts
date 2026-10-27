// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
/** Municipal closures as an RFC 5545 VCALENDAR of all-day events; empty text means no holidays. */
export abstract class HolidayCalendar {
  abstract validate(calendar: string): boolean;
  abstract isHoliday(calendar: string, date: Temporal.PlainDate): boolean;
}
