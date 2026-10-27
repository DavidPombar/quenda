// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { IcalHolidayCalendar } from "./ical-holiday-calendar";
const calendar = new IcalHolidayCalendar();
function ics(...events: string[][]) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Quenda//Holidays//GL",
    ...events.flatMap((lines, index) => [
      "BEGIN:VEVENT",
      `UID:holiday-${index}@quenda`,
      "DTSTAMP:20260101T000000Z",
      ...lines,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
const day = (value: string) => Temporal.PlainDate.from(value);
describe("municipal holiday calendar", () => {
  it("should treat an empty calendar as valid and without holidays", () => {
    expect(calendar.validate("")).toBe(true);
    expect(calendar.isHoliday("", day("2026-12-25"))).toBe(false);
  });
  it("should close a single all-day holiday only on its date", () => {
    const text = ics(["DTSTART;VALUE=DATE:20260724", "SUMMARY:Patrón"]);
    expect(calendar.validate(text)).toBe(true);
    expect(calendar.isHoliday(text, day("2026-07-24"))).toBe(true);
    expect(calendar.isHoliday(text, day("2026-07-25"))).toBe(false);
    expect(calendar.isHoliday(text, day("2027-07-24"))).toBe(false);
  });
  it("should repeat yearly holidays and honour EXDATE and cancelled events", () => {
    const text = ics(
      [
        "DTSTART;VALUE=DATE:20251225",
        "RRULE:FREQ=YEARLY",
        "EXDATE;VALUE=DATE:20271225",
      ],
      ["DTSTART;VALUE=DATE:20260101", "STATUS:CANCELLED"],
    );
    expect(calendar.isHoliday(text, day("2026-12-25"))).toBe(true);
    expect(calendar.isHoliday(text, day("2027-12-25"))).toBe(false);
    expect(calendar.isHoliday(text, day("2028-12-25"))).toBe(true);
    expect(calendar.isHoliday(text, day("2026-01-01"))).toBe(false);
  });
  it("should cover every day of a multi-day closure with an exclusive DTEND", () => {
    const text = ics([
      "DTSTART;VALUE=DATE:20260810",
      "DTEND;VALUE=DATE:20260813",
    ]);
    expect(calendar.isHoliday(text, day("2026-08-12"))).toBe(true);
    expect(calendar.isHoliday(text, day("2026-08-13"))).toBe(false);
  });
  it("should reject timed events, other frequencies and malformed text", () => {
    expect(calendar.validate(ics(["DTSTART:20260724T100000Z"]))).toBe(false);
    expect(
      calendar.validate(
        ics(["DTSTART;VALUE=DATE:20260724", "RRULE:FREQ=WEEKLY"]),
      ),
    ).toBe(false);
    expect(calendar.validate("BEGIN:VCALENDAR")).toBe(false);
  });
});
