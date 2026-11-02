// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { ActivityPlanner } from "./activity-planner";
import { ActivityRepository } from "../domain/activity.repository";
import { IcalOpeningCalendar } from "../../facilities/infrastructure/calendar/ical-opening-calendar";
import { IcalHolidayCalendar } from "../../facilities/infrastructure/calendar/ical-holiday-calendar";
import type { MunicipalitySettings } from "../../../shared/application/municipality-settings";
const ZONE = "Europe/Madrid";
const opening = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Test//EN",
  "BEGIN:VEVENT",
  "UID:open@test",
  "DTSTAMP:20260101T000000Z",
  "DTSTART;TZID=Europe/Madrid:20260101T090000",
  "DTEND;TZID=Europe/Madrid:20260101T220000",
  "RRULE:FREQ=DAILY",
  "END:VEVENT",
  "END:VCALENDAR",
  "",
].join("\r\n");
const holidays = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Test//EN",
  "BEGIN:VEVENT",
  "UID:holiday@test",
  "DTSTAMP:20260101T000000Z",
  "DTSTART;VALUE=DATE:20261208",
  "SUMMARY:Inmaculada",
  "END:VEVENT",
  "END:VCALENDAR",
  "",
].join("\r\n");
/** Only the clash lookup reaches the database; it reports the given session indexes as booked. */
function planner(booked: number[] = []) {
  const repository = {
    clashes: async () =>
      booked.map((index) => ({ index, reason: "booking" as const })),
  } as unknown as ActivityRepository;
  return new ActivityPlanner(
    repository,
    new IcalOpeningCalendar(),
    new IcalHolidayCalendar(),
  );
}
const municipality = {
  id: "m1",
  timezone: ZONE,
  holidaysCalendar: holidays,
} as MunicipalitySettings;
const facility = {
  id: "f1",
  status: "active" as const,
  openingCalendar: opening,
  followsMunicipalHolidays: true,
};
const resource = { id: "r1", parentId: null, active: true };
const rule = {
  weekdays: [2, 4],
  startsLocal: "17:00",
  endsLocal: "18:00",
  startsOn: "2026-11-01",
  endsOn: "2026-12-31",
  exceptions: ["2026-12-24"],
};
const plan = (
  overrides: Partial<typeof rule> = {},
  booked: number[] = [],
  now = "2026-10-30T10:00:00Z",
) =>
  planner(booked).plan({
    activityId: "a1",
    rule: { ...rule, ...overrides },
    facility,
    resource,
    resources: [resource],
    municipality,
    now: Temporal.Instant.from(now),
  });
const local = (instant: Temporal.Instant) =>
  instant.toZonedDateTimeISO(ZONE).toPlainDateTime().toString({
    smallestUnit: "minute",
  });
describe("Activity sessions", () => {
  it("should expand Tuesdays and Thursdays at 17:00 local time across the DST change", async () => {
    const result = await plan(
      { startsOn: "2026-10-20" },
      [],
      "2026-10-15T10:00:00Z",
    );
    if (result.kind !== "ok") throw new Error(result.kind);
    const starts = result.sessions.map((session) => local(session.start));
    // Summer time ends on 25 October 2026; the local time stays 17:00.
    expect(starts[0]).toBe("2026-10-20T17:00");
    expect(result.sessions[0].start.toString()).toBe("2026-10-20T15:00:00Z");
    expect(result.sessions[2].start.toString()).toBe("2026-10-27T16:00:00Z");
    // 8 December (Tuesday) is a municipal holiday and 24 December (Thursday) an exception.
    expect(starts).not.toContain("2026-12-08T17:00");
    expect(starts).not.toContain("2026-12-24T17:00");
    expect(starts.at(-1)).toBe("2026-12-31T17:00");
    expect(result.sessions).toHaveLength(20);
    expect(result.unitIds).toEqual(["r1"]);
  });
  it("should leave out sessions that have started", async () => {
    const result = await plan({}, [], "2026-11-05T16:30:00Z");
    if (result.kind !== "ok") throw new Error(result.kind);
    expect(local(result.sessions[0].start)).toBe("2026-11-10T17:00");
  });
  it("should report sessions outside the opening hours and on a taken court as clashes", async () => {
    const outside = await plan({ startsLocal: "08:00", endsLocal: "09:30" });
    expect(outside.kind).toBe("clashes");
    if (outside.kind !== "clashes") return;
    expect(outside.clashes[0]).toMatchObject({
      date: "2026-11-03",
      reason: "closed",
    });
    const taken = await plan({}, [1]);
    expect(taken).toMatchObject({
      kind: "clashes",
      clashes: [{ date: "2026-11-05", reason: "booking" }],
    });
  });
  it("should refuse a rule with no session left", async () => {
    expect(
      (await plan({ startsOn: "2026-10-01", endsOn: "2026-10-29" })).kind,
    ).toBe("invalid");
  });
});
