// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
export function weeklyCalendar(args: {
  id: string;
  timezone: string;
  firstDate: string;
  days: string[];
  opening: string;
  closing: string;
}): string {
  const weekdays = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  let start = Temporal.PlainDate.from(args.firstDate);
  if (!args.days.length) throw new Error("At least one weekday is required");
  while (!args.days.includes(weekdays[start.dayOfWeek - 1]))
    start = start.add({ days: 1 });
  const opening = Temporal.PlainTime.from(args.opening);
  const closing = Temporal.PlainTime.from(args.closing);
  if (Temporal.PlainTime.compare(opening, closing) >= 0)
    throw new Error("Closing must follow opening");
  const stamp = (time: Temporal.PlainTime) =>
    start.toString().replaceAll("-", "") +
    "T" +
    time.toString({ smallestUnit: "second" }).replaceAll(":", "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Quenda//Opening hours//EN",
    "BEGIN:VEVENT",
    `UID:${args.id}@quenda`,
    "DTSTAMP:20260101T000000Z",
    `DTSTART;TZID=${args.timezone}:${stamp(opening)}`,
    `DTEND;TZID=${args.timezone}:${stamp(closing)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${args.days.join(",")}`,
    "SUMMARY:Opening hours",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
