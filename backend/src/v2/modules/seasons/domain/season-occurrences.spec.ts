// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { expandOccurrences, weeklyRule } from "./season-occurrences";
const local = (instant: Temporal.Instant) =>
  instant.toZonedDateTimeISO("Europe/Madrid").toPlainDateTime().toString();
describe("season occurrences", () => {
  it("should repeat on the chosen weekdays between the campaign dates, both included", () => {
    const occurrences = expandOccurrences({
      startsOn: Temporal.PlainDate.from("2026-09-01"),
      endsOn: Temporal.PlainDate.from("2026-09-10"),
      weekdays: [2, 4],
      startsLocal: Temporal.PlainTime.from("19:00"),
      endsLocal: Temporal.PlainTime.from("21:00"),
      timezone: "Europe/Madrid",
    });
    expect(occurrences.map((item) => local(item.start))).toEqual([
      "2026-09-01T19:00:00",
      "2026-09-03T19:00:00",
      "2026-09-08T19:00:00",
      "2026-09-10T19:00:00",
    ]);
    expect(local(occurrences[0].end)).toBe("2026-09-01T21:00:00");
  });
  it("should keep the local time across a daylight-saving change and skip times that do not exist", () => {
    const sunday = (time: string) =>
      expandOccurrences({
        startsOn: Temporal.PlainDate.from("2027-03-28"),
        endsOn: Temporal.PlainDate.from("2027-03-28"),
        weekdays: [7],
        startsLocal: Temporal.PlainTime.from(time),
        endsLocal: Temporal.PlainTime.from("04:00"),
        timezone: "Europe/Madrid",
      });
    // 02:30 does not exist on 28 March 2027 in Madrid.
    expect(sunday("02:30")).toEqual([]);
    expect(sunday("03:00").map((item) => local(item.start))).toEqual([
      "2027-03-28T03:00:00",
    ]);
  });
  it("should describe the slot as a weekly RFC 5545 rule", () => {
    expect(weeklyRule([4, 2], "2027-06-30")).toBe(
      "FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20270630",
    );
  });
});
