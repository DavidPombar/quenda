// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { OpeningCalendar } from "../../facilities/domain/opening-calendar";
/**
 * A pass opens the door on the reservation's day, from the facility's first opening that day
 * (or midnight when the calendar has none) until the reservation ends.
 */
@Injectable()
export class AccessWindow {
  constructor(private readonly calendar: OpeningCalendar) {}
  of(args: {
    openingCalendar: string;
    timezone: string;
    start: Temporal.Instant;
    end: Temporal.Instant;
  }) {
    const date = args.start.toZonedDateTimeISO(args.timezone).toPlainDate();
    const midnight = date
      .toZonedDateTime({ timeZone: args.timezone })
      .toInstant();
    const openings = this.calendar
      .expand({ calendar: args.openingCalendar, timezone: args.timezone, date })
      .map((interval) => interval.start)
      .sort(Temporal.Instant.compare);
    const opening = openings[0] ?? midnight;
    const from =
      Temporal.Instant.compare(opening, args.start) <= 0 ? opening : args.start;
    return { from, until: args.end };
  }
}
