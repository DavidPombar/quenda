// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { blockEnd, penaltyStanding, reachesLimit } from "./no-show-penalty";
const settings = {
  timezone: "Europe/Madrid",
  noShowLimit: 3,
  noShowWindowDays: 30,
  noShowBlockDays: 7,
};
const now = Temporal.Instant.from("2026-10-27T18:00:00Z");
const daysAgo = (days: number) => now.subtract({ hours: days * 24 });
describe("No-show penalty", () => {
  it("should count only no-shows inside the window and report how many remain", () => {
    const standing = penaltyStanding({
      noShowStarts: [daysAgo(1), daysAgo(29), daysAgo(31)],
      settings,
      now,
      blockedUntil: null,
    });
    expect(standing).toMatchObject({ count: 2, remaining: 1, enabled: true });
    expect(reachesLimit(standing)).toBe(false);
  });
  it("should reach the limit on the third no-show unless a block is already in force", () => {
    const starts = [daysAgo(1), daysAgo(2), daysAgo(3)];
    expect(
      reachesLimit(
        penaltyStanding({
          noShowStarts: starts,
          settings,
          now,
          blockedUntil: null,
        }),
      ),
    ).toBe(true);
    expect(
      reachesLimit(
        penaltyStanding({
          noShowStarts: starts,
          settings,
          now,
          blockedUntil: now.add({ hours: 24 }),
        }),
      ),
    ).toBe(false);
  });
  it("should never block when the municipality disables the penalty", () => {
    const standing = penaltyStanding({
      noShowStarts: [daysAgo(1), daysAgo(2), daysAgo(3), daysAgo(4)],
      settings: { ...settings, noShowLimit: 0 },
      now,
      blockedUntil: null,
    });
    expect(standing).toMatchObject({ enabled: false, remaining: 0, count: 4 });
    expect(reachesLimit(standing)).toBe(false);
  });
  it("should block for whole local days across a daylight saving change", () => {
    expect(
      blockEnd(
        settings,
        Temporal.Instant.from("2026-10-24T10:00:00Z"),
      ).toString(),
    ).toBe("2026-10-31T11:00:00Z");
  });
});
