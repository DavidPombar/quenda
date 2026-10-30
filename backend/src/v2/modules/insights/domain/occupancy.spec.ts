// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import {
  occupancyReport,
  weeklyOccupancy,
  type FacilityActivity,
  type Span,
} from "./occupancy";
const TZ = "Europe/Madrid";
const local = (value: string) =>
  Temporal.PlainDateTime.from(value).toZonedDateTime(TZ).toInstant();
const span = (from: string, to: string): Span => ({
  start: local(from),
  end: local(to),
});
const day = (date: string) => Temporal.PlainDate.from(date);
/** Opens 10:00–12:00 every day of the range. */
function dailyOpening(from: string, to: string) {
  const spans: Span[] = [];
  for (
    let date = day(from);
    Temporal.PlainDate.compare(date, day(to)) <= 0;
    date = date.add({ days: 1 })
  )
    spans.push(span(`${date}T10:00`, `${date}T12:00`));
  return spans;
}
function facility(overrides: Partial<FacilityActivity> = {}): FacilityActivity {
  return {
    id: "court",
    name: "Court",
    sport: "padel",
    open: dailyOpening("2026-10-01", "2026-10-31"),
    active: [span("2000-01-01T00:00", "2100-01-01T00:00")],
    closed: [],
    bookings: [],
    ...overrides,
  };
}
function report(
  value: FacilityActivity,
  from = "2026-10-05",
  to = "2026-10-11",
) {
  return occupancyReport({
    timezone: TZ,
    from: day(from),
    to: day(to),
    facilities: [value],
  });
}
describe("occupancy report", () => {
  it.each([
    { units: ["a"], expected: 50, minutes: 60 },
    { units: ["a", "b"], expected: 100, minutes: 120 },
  ])(
    "should weight a reservation occupying $units by its leaf units",
    ({ units, expected, minutes }) => {
      const result = report(
        facility({
          unitIds: ["a", "b"],
          open: [span("2026-10-05T10:00", "2026-10-05T11:00")],
          bookings: [
            {
              ...span("2026-10-05T10:00", "2026-10-05T11:00"),
              status: "confirmed",
              unitIds: units,
            },
          ],
        }),
        "2026-10-05",
        "2026-10-05",
      );
      expect(result).toMatchObject({
        confirmed: 1,
        openMinutes: 120,
        bookedMinutes: minutes,
        occupancy: expected,
      });
      expect(result.heatmap).toEqual([
        {
          weekday: 1,
          hour: 10,
          openMinutes: 120,
          bookedMinutes: minutes,
          occupancy: expected,
        },
      ]);
    },
  );
  it("should report each court, with a whole court aggregating its parts", () => {
    const hour = span("2026-10-05T10:00", "2026-10-05T11:00");
    const result = report(
      facility({
        unitIds: ["a", "b"],
        resources: [
          {
            id: "whole",
            name: "Pista completa",
            parentId: null,
            unitIds: ["a", "b"],
          },
          { id: "a", name: "Tercio A", parentId: "whole", unitIds: ["a"] },
          { id: "b", name: "Tercio B", parentId: "whole", unitIds: ["b"] },
        ],
        open: [hour],
        bookings: [
          { ...hour, status: "confirmed", unitIds: ["a"], resourceId: "a" },
          {
            ...hour,
            status: "cancelled",
            unitIds: ["a", "b"],
            resourceId: "whole",
          },
        ],
      }),
      "2026-10-05",
      "2026-10-05",
    );
    expect(result.byFacility[0].byResource).toEqual([
      expect.objectContaining({
        id: "whole",
        confirmed: 0,
        cancelled: 1,
        bookedMinutes: 60,
        openMinutes: 120,
        occupancy: 50,
      }),
      expect.objectContaining({
        id: "a",
        confirmed: 1,
        cancelled: 0,
        bookedMinutes: 60,
        openMinutes: 60,
        occupancy: 100,
      }),
      expect.objectContaining({
        id: "b",
        confirmed: 0,
        bookedMinutes: 0,
        occupancy: 0,
      }),
    ]);
  });
  it("should divide booked by open minutes and place them in local weekday × hour cells", () => {
    const result = report(
      facility({
        bookings: [
          {
            ...span("2026-10-05T10:00", "2026-10-05T11:00"),
            status: "confirmed",
          },
          {
            ...span("2026-10-06T10:00", "2026-10-06T11:00"),
            status: "cancelled",
          },
        ],
      }),
    );
    expect(result).toMatchObject({
      confirmed: 1,
      cancelled: 1,
      openMinutes: 7 * 120,
      bookedMinutes: 60,
      occupancy: 7,
    });
    expect(result.heatmap).toHaveLength(14);
    expect(result.heatmap[0]).toEqual({
      weekday: 1,
      hour: 10,
      bookedMinutes: 60,
      openMinutes: 60,
      occupancy: 100,
    });
    expect(result.heatmap[1]).toMatchObject({
      weekday: 1,
      hour: 11,
      occupancy: 0,
    });
  });
  it("should count no-shows apart without adding their time to booked minutes", () => {
    const result = report(
      facility({
        bookings: [
          {
            ...span("2026-10-05T10:00", "2026-10-05T11:00"),
            status: "no_show",
          },
        ],
      }),
    );
    expect(result).toMatchObject({
      noShows: 1,
      confirmed: 0,
      bookedMinutes: 0,
    });
    expect(result.byFacility[0].noShows).toBe(1);
  });
  it("should split a booking that straddles two hours", () => {
    const result = report(
      facility({
        bookings: [
          {
            ...span("2026-10-05T10:30", "2026-10-05T11:30"),
            status: "confirmed",
          },
        ],
      }),
    );
    expect(
      result.heatmap
        .filter((cell) => cell.weekday === 1)
        .map((cell) => cell.bookedMinutes),
    ).toEqual([30, 30]);
  });
  it("should exclude holidays and periods out of service from open time", () => {
    const result = report(
      facility({
        closed: [span("2026-10-07T00:00", "2026-10-08T00:00")],
        active: [
          span("2000-01-01T00:00", "2026-10-09T00:00"),
          span("2026-10-10T00:00", "2100-01-01T00:00"),
        ],
      }),
    );
    expect(result.openMinutes).toBe(5 * 120);
    expect(result.heatmap.some((cell) => cell.weekday === 3)).toBe(false);
    expect(result.heatmap.some((cell) => cell.weekday === 5)).toBe(false);
  });
  it("should keep the local hour across the October DST change", () => {
    const result = report(
      facility({ open: dailyOpening("2026-10-20", "2026-10-31") }),
      "2026-10-24",
      "2026-10-26",
    );
    expect(result.openMinutes).toBe(3 * 120);
    expect(new Set(result.heatmap.map((cell) => cell.hour))).toEqual(
      new Set([10, 11]),
    );
  });
  it("should count the DST repeated hour once per wall-clock hour bucket", () => {
    const night: Span = {
      start: Temporal.Instant.from("2026-10-25T00:00:00Z"),
      end: Temporal.Instant.from("2026-10-25T02:00:00Z"),
    };
    const result = report(
      facility({ open: [night] }),
      "2026-10-25",
      "2026-10-25",
    );
    expect(result.openMinutes).toBe(120);
    expect(result.heatmap).toEqual([
      { weekday: 7, hour: 2, bookedMinutes: 0, openMinutes: 120, occupancy: 0 },
    ]);
  });
  it("should report null occupancy for a facility that was never open", () => {
    const result = report(facility({ active: [] }));
    expect(result.byFacility[0].occupancy).toBe(null);
    expect(result.heatmap).toEqual([]);
  });
});
describe("weekly occupancy", () => {
  it("should split open time by ISO week, weekday and local hour, counting no-shows apart", () => {
    const cells = weeklyOccupancy({
      timezone: TZ,
      from: day("2026-10-11"),
      to: day("2026-10-12"),
      facilities: [
        facility({
          bookings: [
            {
              ...span("2026-10-11T10:00", "2026-10-11T11:00"),
              status: "confirmed",
            },
            {
              ...span("2026-10-12T11:00", "2026-10-12T12:00"),
              status: "no_show",
            },
            {
              ...span("2026-10-12T10:00", "2026-10-12T11:00"),
              status: "cancelled",
            },
          ],
        }),
      ],
    });
    expect(cells).toEqual([
      {
        facilityId: "court",
        isoYear: 2026,
        isoWeek: 41,
        weekday: 7,
        hour: 10,
        bookedMinutes: 60,
        openMinutes: 60,
        occupancy: 100,
        noShowMinutes: 0,
      },
      {
        facilityId: "court",
        isoYear: 2026,
        isoWeek: 41,
        weekday: 7,
        hour: 11,
        bookedMinutes: 0,
        openMinutes: 60,
        occupancy: 0,
        noShowMinutes: 0,
      },
      {
        facilityId: "court",
        isoYear: 2026,
        isoWeek: 42,
        weekday: 1,
        hour: 10,
        bookedMinutes: 0,
        openMinutes: 60,
        occupancy: 0,
        noShowMinutes: 0,
      },
      {
        facilityId: "court",
        isoYear: 2026,
        isoWeek: 42,
        weekday: 1,
        hour: 11,
        bookedMinutes: 0,
        openMinutes: 60,
        occupancy: 0,
        noShowMinutes: 60,
      },
    ]);
  });
  it("should use the ISO week-numbering year across the new year", () => {
    const cells = weeklyOccupancy({
      timezone: TZ,
      from: day("2027-01-01"),
      to: day("2027-01-01"),
      facilities: [
        facility({ open: [span("2027-01-01T10:00", "2027-01-01T11:00")] }),
      ],
    });
    expect(cells).toMatchObject([{ isoYear: 2026, isoWeek: 53, weekday: 5 }]);
  });
  it("should leave out hours when the facility is closed or on a holiday", () => {
    const cells = weeklyOccupancy({
      timezone: TZ,
      from: day("2026-10-12"),
      to: day("2026-10-13"),
      facilities: [
        facility({ closed: [span("2026-10-12T00:00", "2026-10-13T00:00")] }),
      ],
    });
    expect(cells.map((cell) => cell.weekday)).toEqual([2, 2]);
  });
});
