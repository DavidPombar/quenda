// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
export interface Holiday {
  /** First day, YYYY-MM-DD. */
  date: string;
  name: string;
  /** Repeats every year on the same day. */
  yearly: boolean;
}
function escape(text: string) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\;")
    .replaceAll(",", "\\,")
    .replaceAll(/\r?\n/g, "\\n");
}
function unescape(text: string) {
  return text.replaceAll(/\\([\;,nN])/g, (_match, char: string) =>
    char === "n" || char === "N" ? "\n" : char,
  );
}
const compact = (date: string) => date.replaceAll("-", "");
/** RFC 5545 calendar of all-day holidays; empty text when there are none. */
export function holidaysCalendar(holidays: Holiday[], tenantId: string) {
  if (!holidays.length) return "";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Quenda//Municipal holidays//GL",
    ...holidays.flatMap((holiday) => [
      "BEGIN:VEVENT",
      `UID:${holiday.date}-${holiday.yearly ? "yearly" : "once"}.${tenantId}@quenda`,
      "DTSTAMP:20260101T000000Z",
      `DTSTART;VALUE=DATE:${compact(holiday.date)}`,
      `DTEND;VALUE=DATE:${compact(Temporal.PlainDate.from(holiday.date).add({ days: 1 }).toString())}`,
      ...(holiday.yearly ? ["RRULE:FREQ=YEARLY"] : []),
      `SUMMARY:${escape(holiday.name.trim())}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
/**
 * Reads the one-day holidays this screen can edit. `simplified` reports rules the list cannot
 * show (multi-day events, exceptions, other recurrences); saving from the list drops them.
 */
export function parseHolidays(calendar: string): {
  holidays: Holiday[];
  simplified: boolean;
} {
  const lines = calendar.replaceAll(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const holidays: Holiday[] = [];
  let simplified = false;
  let event: Record<string, string> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") event = {};
    else if (line === "END:VEVENT" && event) {
      const start = /VALUE=DATE[^:]*:(\d{8})$/.exec(event.DTSTART ?? "")?.[1];
      const rule = event.RRULE ?? "";
      if (!start || event.STATUS === "CANCELLED") simplified ||= !start;
      else {
        const date = `${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6)}`;
        const end = /:(\d{8})$/.exec(event.DTEND ?? "")?.[1];
        const next = compact(
          Temporal.PlainDate.from(date).add({ days: 1 }).toString(),
        );
        if (
          (end && end !== next) ||
          (rule && rule !== "FREQ=YEARLY") ||
          event.EXDATE ||
          event.RDATE
        )
          simplified = true;
        holidays.push({
          date,
          name: unescape(event.SUMMARY ?? ""),
          yearly: rule.startsWith("FREQ=YEARLY"),
        });
      }
      event = null;
    } else if (event) {
      const separator = line.search(/[:;]/);
      if (separator > 0) {
        const name = line.slice(0, separator).toUpperCase();
        const value =
          name === "DTSTART" || name === "DTEND"
            ? line.slice(separator)
            : line.slice(line.indexOf(":") + 1);
        event[name] = value;
      }
    }
  }
  return {
    holidays: holidays.sort((a, b) => a.date.localeCompare(b.date)),
    simplified,
  };
}
