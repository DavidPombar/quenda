// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { isAnalyticsEvent, optedOut } from "./analytics-events";
describe("analytics events", () => {
  it("should accept only the fixed events of each site", () => {
    expect(isAnalyticsEvent("app", "booking-confirmed")).toBe(true);
    expect(isAnalyticsEvent("web", "booking-confirmed")).toBe(false);
    expect(isAnalyticsEvent("web", "search")).toBe(true);
    expect(isAnalyticsEvent("app", "anything-else")).toBe(false);
  });
  it("should treat Do Not Track and Global Privacy Control as an opt-out", () => {
    expect(optedOut({ dnt: "1" })).toBe(true);
    expect(optedOut({ gpc: "1" })).toBe(true);
    expect(optedOut({ dnt: "0" })).toBe(false);
    expect(optedOut({})).toBe(false);
  });
});
