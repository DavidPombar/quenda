// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFERENCES,
  noticeKindOf,
  resolvePreferences,
  wants,
} from "./notice-preferences";
describe("notice preferences", () => {
  it("should group both cancellations and every penalty notice under one choice", () => {
    expect(noticeKindOf("cancelled")).toBe("cancellation");
    expect(noticeKindOf("cancelled_by_municipality")).toBe("cancellation");
    for (const kind of ["no_show", "blocked", "unblocked"] as const)
      expect(noticeKindOf(kind)).toBe("penalty");
  });
  it("should email service notices by default and penalty notices only on request", () => {
    expect(wants("reminder", "email", null)).toBe(true);
    expect(wants("rescheduled", "push", null)).toBe(true);
    expect(wants("no_show", "email", null)).toBe(false);
    expect(wants("blocked", "push", null)).toBe(false);
    expect(wants("blocked", "email", true)).toBe(true);
    expect(wants("confirmed", "email", false)).toBe(false);
  });
  it("should lay stored choices over the defaults without changing them", () => {
    const resolved = resolvePreferences([
      { kind: "reminder", channel: "email", enabled: false },
      { kind: "penalty", channel: "push", enabled: true },
    ]);
    expect(resolved.reminder).toEqual({ email: false, push: true });
    expect(resolved.penalty).toEqual({ email: false, push: true });
    expect(resolved.confirmation).toEqual({ email: true, push: true });
    expect(DEFAULT_PREFERENCES.reminder.email).toBe(true);
  });
});
