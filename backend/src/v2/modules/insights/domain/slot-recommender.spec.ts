// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import {
  HistoricalOccupancyRecommender,
  SlotCandidate,
  historyKey,
  usualOccupancy,
} from "./slot-recommender";
const day = "2026-11-02"; // a Monday
function slot(
  facilityId: string,
  hour: number,
  resourceId = "r1",
): SlotCandidate {
  const start = Temporal.Instant.from(
    `${day}T${String(hour).padStart(2, "0")}:00:00Z`,
  );
  return {
    facilityId,
    resourceId,
    start,
    end: start.add({ hours: 1 }),
    weekday: 1,
    hour,
  };
}
const recommender = new HistoricalOccupancyRecommender();
describe("HistoricalOccupancyRecommender", () => {
  it("should offer the least usually occupied slots first, three at most", () => {
    const history = new Map([
      [historyKey("a", 1, 10), 90],
      [historyKey("a", 1, 11), 20],
      [historyKey("b", 1, 10), 40],
      [historyKey("b", 1, 12), 5],
    ]);
    const result = recommender.recommend({
      facilityId: "a",
      around: null,
      candidates: [slot("a", 10), slot("a", 11), slot("b", 10), slot("b", 12)],
      history,
      limit: 3,
    });
    expect(
      result.map((value) => [value.facilityId, value.hour, value.occupancyPct]),
    ).toEqual([
      ["b", 12, 5],
      ["a", 11, 20],
      ["b", 10, 40],
    ]);
    expect(result.map((value) => value.sameFacility)).toEqual([
      false,
      true,
      false,
    ]);
  });
  it("should prefer the same facility and then the time closest to the one wanted on a tie", () => {
    const history = new Map([
      [historyKey("a", 1, 9), 30],
      [historyKey("a", 1, 13), 30],
      [historyKey("b", 1, 11), 30],
    ]);
    const result = recommender.recommend({
      facilityId: "a",
      around: slot("a", 12).start,
      candidates: [slot("b", 11), slot("a", 9), slot("a", 13)],
      history,
      limit: 3,
    });
    expect(result.map((value) => [value.facilityId, value.hour])).toEqual([
      ["a", 13],
      ["a", 9],
      ["b", 11],
    ]);
  });
  it("should rank by closeness alone without history, after any slot that has it", () => {
    const result = recommender.recommend({
      facilityId: "a",
      around: slot("a", 12).start,
      candidates: [slot("a", 8), slot("a", 14), slot("b", 11), slot("a", 18)],
      history: new Map([[historyKey("a", 1, 18), 70]]),
      limit: 3,
    });
    expect(result.map((value) => [value.hour, value.occupancyPct])).toEqual([
      [18, 70],
      [11, null],
      [14, null],
    ]);
  });
  it("should offer each start time of a facility once, whatever its number of courts", () => {
    const result = recommender.recommend({
      facilityId: "a",
      around: null,
      candidates: [
        slot("a", 10, "r1"),
        slot("a", 10, "r2"),
        slot("a", 11, "r1"),
      ],
      history: new Map(),
      limit: 3,
    });
    expect(result.map((value) => [value.hour, value.resourceId])).toEqual([
      [10, "r1"],
      [11, "r1"],
    ]);
  });
});
describe("usualOccupancy", () => {
  it("should add booked and open time across weeks before dividing", () => {
    const cell = {
      facilityId: "a",
      isoYear: 2026,
      isoWeek: 40,
      weekday: 1,
      hour: 10,
      noShowMinutes: 0,
      occupancy: null,
    };
    const usual = usualOccupancy([
      { ...cell, bookedMinutes: 60, openMinutes: 60 },
      { ...cell, isoWeek: 41, bookedMinutes: 0, openMinutes: 120 },
      { ...cell, hour: 11, bookedMinutes: 0, openMinutes: 0 },
    ]);
    expect(usual.get(historyKey("a", 1, 10))).toBe(33);
    expect(usual.has(historyKey("a", 1, 11))).toBe(false);
  });
});
