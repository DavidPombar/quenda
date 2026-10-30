// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { openingWeek } from "./opening-week";
const ZONE = "Europe/Madrid";
const at = (value: string) =>
  Temporal.PlainDateTime.from(value).toZonedDateTime(ZONE).toInstant();
describe("Opening week", () => {
  it("should show local hours across the autumn clock change", () => {
    const days = openingWeek({
      from: Temporal.PlainDate.from("2026-10-24"),
      days: 2,
      timezone: ZONE,
      intervals: [
        { start: at("2026-10-24T09:00"), end: at("2026-10-24T14:00") },
        { start: at("2026-10-24T16:00"), end: at("2026-10-24T21:00") },
        { start: at("2026-10-25T09:00"), end: at("2026-10-25T21:00") },
      ],
      isHoliday: () => false,
    });
    expect(
      days.map((day) => ({
        date: day.date.toString(),
        hours: day.hours.map((hours) => `${hours.from}–${hours.to}`),
      })),
    ).toEqual([
      { date: "2026-10-24", hours: ["09:00:00–14:00:00", "16:00:00–21:00:00"] },
      { date: "2026-10-25", hours: ["09:00:00–21:00:00"] },
    ]);
  });
  it("should close holidays and split intervals crossing midnight", () => {
    const days = openingWeek({
      from: Temporal.PlainDate.from("2026-12-24"),
      days: 3,
      timezone: ZONE,
      intervals: [
        { start: at("2026-12-24T20:00"), end: at("2026-12-25T02:00") },
        { start: at("2026-12-26T10:00"), end: at("2026-12-26T12:00") },
      ],
      isHoliday: (date) => date.toString() === "2026-12-25",
    });
    expect(days.map((day) => day.holiday)).toEqual([false, true, false]);
    expect(days[0].hours.map((hours) => hours.to.toString())).toEqual([
      "23:59:00",
    ]);
    expect(days[1].hours).toEqual([]);
    expect(days[2].hours).toHaveLength(1);
  });
});
