// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
/**
 * Dated occurrences of a weekly slot between two calendar dates (inclusive), in the municipality's
 * time zone. A local time that does not exist on a daylight-saving change is skipped; holidays are
 * deliberately not excluded (#17).
 */
export function expandOccurrences(args: {
  startsOn: Temporal.PlainDate;
  endsOn: Temporal.PlainDate;
  weekdays: readonly number[];
  startsLocal: Temporal.PlainTime;
  endsLocal: Temporal.PlainTime;
  timezone: string;
}): { start: Temporal.Instant; end: Temporal.Instant }[] {
  const days = new Set(args.weekdays);
  const result: { start: Temporal.Instant; end: Temporal.Instant }[] = [];
  for (
    let date = args.startsOn;
    Temporal.PlainDate.compare(date, args.endsOn) <= 0;
    date = date.add({ days: 1 })
  ) {
    if (!days.has(date.dayOfWeek)) continue;
    try {
      const start = date
        .toPlainDateTime(args.startsLocal)
        .toZonedDateTime(args.timezone, { disambiguation: "reject" })
        .toInstant();
      const end = date
        .toPlainDateTime(args.endsLocal)
        .toZonedDateTime(args.timezone, { disambiguation: "reject" })
        .toInstant();
      result.push({ start, end });
    } catch {
      /* The local time does not exist that day (DST change). */
    }
  }
  return result;
}
/** RFC 5545 rule for the export: weekly on the given ISO weekdays until the campaign's last day. */
export function weeklyRule(weekdays: readonly number[], endsOn: string) {
  const names = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  const days = [...weekdays].sort().map((day) => names[day - 1]);
  return `FREQ=WEEKLY;BYDAY=${days.join(",")};UNTIL=${endsOn.replaceAll("-", "")}`;
}
