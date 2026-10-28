// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, it, expect } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { IcalOpeningCalendar } from "./ical-opening-calendar";
const calendar = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Quenda//Tests//EN\r\nBEGIN:VEVENT\r\nUID:opening\r\nDTSTAMP:20260101T000000Z\r\nDTSTART;TZID=Europe/Madrid:20260322T090000\r\nDTEND;TZID=Europe/Madrid:20260322T110000\r\nRRULE:FREQ=WEEKLY;BYDAY=SU\r\nEXDATE;TZID=Europe/Madrid:20260405T090000\r\nRDATE;TZID=Europe/Madrid:20260406T090000\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
const engine = new IcalOpeningCalendar();
function expand(date: string, source = calendar) {
  return engine
    .expand({
      calendar: source,
      timezone: "Europe/Madrid",
      date: Temporal.PlainDate.from(date),
    })
    .map((value) => [value.start.toString(), value.end.toString()]);
}
describe("Opening calendar", () => {
  it("should preserve local opening time when daylight saving time starts", () => {
    expect(expand("2026-03-22")).toEqual([
      ["2026-03-22T08:00:00Z", "2026-03-22T10:00:00Z"],
    ]);
    expect(expand("2026-03-29")).toEqual([
      ["2026-03-29T07:00:00Z", "2026-03-29T09:00:00Z"],
    ]);
  });
  it("should remove an opening when its occurrence is excluded", () =>
    expect(expand("2026-04-05")).toEqual([]));
  it("should add an opening when an RDATE is supplied", () =>
    expect(expand("2026-04-06")).toEqual([
      ["2026-04-06T07:00:00Z", "2026-04-06T09:00:00Z"],
    ]));
  it("should replace an opening when a recurrence exception changes the time", () => {
    const source = calendar.replace(
      "END:VCALENDAR",
      "BEGIN:VEVENT\r\nUID:opening\r\nDTSTAMP:20260101T000000Z\r\nRECURRENCE-ID;TZID=Europe/Madrid:20260329T090000\r\nDTSTART;TZID=Europe/Madrid:20260329T140000\r\nDTEND;TZID=Europe/Madrid:20260329T160000\r\nEND:VEVENT\r\nEND:VCALENDAR",
    );
    expect(expand("2026-03-29", source)).toEqual([
      ["2026-03-29T12:00:00Z", "2026-03-29T14:00:00Z"],
    ]);
  });
  it("should expand a whole range at once, honouring DST, EXDATE and RDATE", () => {
    expect(
      engine
        .expandRange({
          calendar,
          timezone: "Europe/Madrid",
          from: Temporal.PlainDate.from("2026-03-22"),
          to: Temporal.PlainDate.from("2026-04-06"),
        })
        .map((value) => value.start.toString()),
    ).toEqual([
      "2026-03-22T08:00:00Z",
      "2026-03-29T07:00:00Z",
      "2026-04-06T07:00:00Z",
    ]);
  });
  it("should reject malformed or unbounded high-frequency calendars when validating", () => {
    expect(engine.validate("nonsense", "Europe/Madrid")).toBe(false);
    expect(
      engine.validate(
        calendar.replace("FREQ=WEEKLY;BYDAY=SU", "FREQ=SECONDLY"),
        "Europe/Madrid",
      ),
    ).toBe(false);
  });
});
