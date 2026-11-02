// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import type { WeeklyRule } from "./activity.entity";
/** Sessions an activity may have; a school year twice a week stays well below. */
export const MAX_SESSIONS = 400;
const DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const local = (date: Temporal.PlainDate, time: Temporal.PlainTime) =>
  date
    .toPlainDateTime(time)
    .toString({ smallestUnit: "second" })
    .replaceAll("-", "")
    .replaceAll(":", "");
const utc = (instant: Temporal.Instant) =>
  instant
    .toString({ smallestUnit: "second" })
    .replaceAll("-", "")
    .replaceAll(":", "");
/** Normalised rule: weekdays and exceptions sorted and deduplicated, times as HH:MM. */
export function normaliseRule(rule: WeeklyRule): WeeklyRule {
  return {
    weekdays: [...new Set(rule.weekdays)].sort((a, b) => a - b),
    startsLocal: Temporal.PlainTime.from(rule.startsLocal).toString({
      smallestUnit: "minute",
    }),
    endsLocal: Temporal.PlainTime.from(rule.endsLocal).toString({
      smallestUnit: "minute",
    }),
    startsOn: Temporal.PlainDate.from(rule.startsOn).toString(),
    endsOn: Temporal.PlainDate.from(rule.endsOn).toString(),
    exceptions: [...new Set(rule.exceptions)]
      .map((date) => Temporal.PlainDate.from(date).toString())
      .sort(),
  };
}
/** Whether the rule is coherent: weekdays 1–7, start before end, dates in order. */
export function isValidRule(rule: WeeklyRule): boolean {
  try {
    const value = normaliseRule(rule);
    return (
      value.weekdays.length > 0 &&
      value.weekdays.every((day) => Number.isInteger(day) && day >= 1 && day <= 7) &&
      Temporal.PlainTime.compare(
        Temporal.PlainTime.from(value.startsLocal),
        Temporal.PlainTime.from(value.endsLocal),
      ) < 0 &&
      Temporal.PlainDate.compare(
        Temporal.PlainDate.from(value.startsOn),
        Temporal.PlainDate.from(value.endsOn),
      ) <= 0 &&
      value.exceptions.length <= 200
    );
  } catch {
    return false;
  }
}
/**
 * The rule as an RFC 5545 VCALENDAR: one weekly event from the first matching date until the end
 * of the last day, with an EXDATE per exception. Null when no date of the range matches a weekday.
 * Times carry the municipality's TZID, so sessions keep their local time across DST changes.
 */
export function scheduleCalendar(args: {
  id: string;
  rule: WeeklyRule;
  timezone: string;
}): string | null {
  const rule = normaliseRule(args.rule);
  const startsOn = Temporal.PlainDate.from(rule.startsOn);
  const endsOn = Temporal.PlainDate.from(rule.endsOn);
  const startsLocal = Temporal.PlainTime.from(rule.startsLocal);
  const endsLocal = Temporal.PlainTime.from(rule.endsLocal);
  let first = startsOn;
  while (!rule.weekdays.includes(first.dayOfWeek)) {
    first = first.add({ days: 1 });
    if (Temporal.PlainDate.compare(first, endsOn) > 0) return null;
  }
  const until = endsOn
    .add({ days: 1 })
    .toZonedDateTime(args.timezone)
    .toInstant()
    .subtract({ seconds: 1 });
  const zone = `TZID=${args.timezone}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Quenda//Activity//GL",
    "BEGIN:VEVENT",
    `UID:${args.id}@quenda`,
    `DTSTAMP:${utc(first.toZonedDateTime("UTC").toInstant())}`,
    `DTSTART;${zone}:${local(first, startsLocal)}`,
    `DTEND;${zone}:${local(first, endsLocal)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${rule.weekdays.map((day) => DAYS[day - 1]).join(",")};UNTIL=${utc(until)}`,
    ...rule.exceptions.map(
      (date) =>
        `EXDATE;${zone}:${local(Temporal.PlainDate.from(date), startsLocal)}`,
    ),
    "SUMMARY:Sesión",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
/** Where an activity's session clashes with what already holds its court. */
export type ClashReason =
  | "booking"
  | "season"
  | "activity"
  | "waitlist_hold"
  | "closed";
export interface SessionClash {
  start: Temporal.Instant;
  end: Temporal.Instant;
  /** Local date of the session, to add it as an exception. */
  date: string;
  reason: ClashReason;
}
