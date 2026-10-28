// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import ICAL from "ical.js";
import { Temporal } from "@js-temporal/polyfill";
import { bookingCalendar } from "./ical-booking-calendar";
const entry = {
  bookingId: "30000000-0000-4000-8000-000000000001",
  start: Temporal.Instant.from("2026-10-25T09:00:00Z"),
  end: Temporal.Instant.from("2026-10-25T10:00:00Z"),
  status: "cancelled" as const,
  sequence: 2,
  createdAt: Temporal.Instant.from("2026-10-20T08:00:00Z"),
  facilityName: "Pistas de pádel, Carballeira",
  facilityAddress: "Rúa da Carballeira, 12",
  municipalityName: "Concello de Vilaverde",
};
describe("RFC 5545 booking calendar", () => {
  it("should round-trip a cancelled booking with escaped text and UTC times", () => {
    const text = bookingCalendar({
      entries: [entry],
      generatedAt: Temporal.Instant.from("2026-10-21T07:30:00Z"),
    });
    expect(text).toContain("\r\n");
    const root = new ICAL.Component(ICAL.parse(text));
    expect(root.getFirstPropertyValue("method")).toBe("PUBLISH");
    const [component] = root.getAllSubcomponents("vevent");
    const event = new ICAL.Event(component);
    expect(event.uid).toBe(`${entry.bookingId}@quenda`);
    expect(event.sequence).toBe(2);
    expect(event.summary).toBe(entry.facilityName);
    expect(event.location).toBe(entry.facilityAddress);
    expect(component.getFirstPropertyValue("status")).toBe("CANCELLED");
    expect(event.startDate.toString()).toBe("2026-10-25T09:00:00Z");
    expect(String(component.getFirstPropertyValue("dtstamp"))).toBe(
      "2026-10-21T07:30:00Z",
    );
  });
});
