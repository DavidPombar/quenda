// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import {
  isValidRule,
  normaliseRule,
  scheduleCalendar,
} from "./activity-schedule";
const rule = {
  weekdays: [4, 2, 2],
  startsLocal: "17:00",
  endsLocal: "18:00",
  startsOn: "2026-11-01",
  endsOn: "2027-06-30",
  exceptions: ["2026-12-24", "2026-12-22"],
};
describe("Activity weekly rule", () => {
  it("should sort and deduplicate weekdays and exceptions", () => {
    expect(normaliseRule(rule)).toMatchObject({
      weekdays: [2, 4],
      exceptions: ["2026-12-22", "2026-12-24"],
    });
  });
  it("should reject a rule that ends before it starts or has no weekday", () => {
    expect(isValidRule(rule)).toBe(true);
    expect(isValidRule({ ...rule, endsLocal: "16:00" })).toBe(false);
    expect(isValidRule({ ...rule, endsOn: "2026-10-01" })).toBe(false);
    expect(isValidRule({ ...rule, weekdays: [] })).toBe(false);
    expect(isValidRule({ ...rule, weekdays: [8] })).toBe(false);
  });
  it("should write an RFC 5545 weekly event from the first matching day", () => {
    const calendar = scheduleCalendar({
      id: "a1",
      rule,
      timezone: "Europe/Madrid",
    })!;
    // 1 November 2026 is a Sunday: the first session is Tuesday the 3rd.
    expect(calendar).toContain(
      "DTSTART;TZID=Europe/Madrid:20261103T170000\r\n",
    );
    expect(calendar).toContain("DTEND;TZID=Europe/Madrid:20261103T180000\r\n");
    // The last local day ends at midnight in Madrid, 22:00 UTC in summer.
    expect(calendar).toContain(
      "RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20270630T215959Z\r\n",
    );
    expect(calendar).toContain(
      "EXDATE;TZID=Europe/Madrid:20261222T170000\r\n",
    );
    expect(calendar).toContain("UID:a1@quenda");
  });
  it("should have no calendar when no day of the range matches a weekday", () => {
    expect(
      scheduleCalendar({
        id: "a1",
        rule: { ...rule, weekdays: [1], startsOn: "2026-11-03", endsOn: "2026-11-05" },
        timezone: "Europe/Madrid",
      }),
    ).toBeNull();
  });
});
