// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { promotions } from "./enrolment-queue";
const at = (minute: number) => ({
  id: `p${minute}`,
  createdAt: Temporal.Instant.from("2026-11-03T10:00:00Z").add({
    minutes: minute,
  }),
});
describe("promotions", () => {
  it("moves up the oldest people waiting, as many as there are free places", () => {
    const waiting = [at(3), at(1), at(2)];
    expect(promotions(8, 6, waiting).map((entry) => entry.id)).toEqual([
      "p1",
      "p2",
    ]);
  });
  it("moves nobody up when the activity is full or over its places", () => {
    expect(promotions(8, 8, [at(1)])).toEqual([]);
    expect(promotions(8, 9, [at(1)])).toEqual([]);
  });
  it("moves everybody up when there is room for all", () => {
    expect(promotions(10, 2, [at(2), at(1)]).map((entry) => entry.id)).toEqual([
      "p1",
      "p2",
    ]);
  });
});
