// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import type { OpeningInterval } from "./opening-calendar";
export interface OpeningDay {
  date: Temporal.PlainDate;
  /** Local opening times of the day, in order; empty when closed. */
  hours: { from: Temporal.PlainTime; to: Temporal.PlainTime }[];
  holiday: boolean;
}
/**
 * Readable schedule of the local days from `from`, built from the expanded calendar so recurrence
 * exceptions and holidays show as they really apply. Intervals crossing midnight are split.
 */
export function openingWeek(args: {
  from: Temporal.PlainDate;
  days: number;
  timezone: string;
  intervals: readonly OpeningInterval[];
  isHoliday: (date: Temporal.PlainDate) => boolean;
}): OpeningDay[] {
  return Array.from({ length: args.days }, (_, index) => {
    const date = args.from.add({ days: index });
    const holiday = args.isHoliday(date);
    const start = date.toZonedDateTime(args.timezone).toInstant();
    const end = date
      .add({ days: 1 })
      .toZonedDateTime(args.timezone)
      .toInstant();
    const hours = holiday
      ? []
      : args.intervals
          .filter(
            (interval) =>
              Temporal.Instant.compare(interval.start, end) < 0 &&
              Temporal.Instant.compare(interval.end, start) > 0,
          )
          .map((interval) => {
            const local = (instant: Temporal.Instant) =>
              instant.toZonedDateTimeISO(args.timezone).toPlainTime();
            return {
              from:
                Temporal.Instant.compare(interval.start, start) < 0
                  ? Temporal.PlainTime.from("00:00")
                  : local(interval.start),
              to:
                Temporal.Instant.compare(interval.end, end) > 0
                  ? Temporal.PlainTime.from("23:59")
                  : local(interval.end),
            };
          });
    return { date, hours, holiday };
  });
}
