// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { isValidHierarchy, occupancy, units } from "./resource-units";
const whole = { id: "whole", parentId: null };
const thirds = ["a", "b", "c"].map((id) => ({ id, parentId: "whole" }));
const court = { id: "court", parentId: null };
const all = [whole, ...thirds, court];
describe("Resource units", () => {
  it("should occupy itself when a resource has no parts", () => {
    expect(units(court, all)).toEqual(["court"]);
  });
  it("should occupy every part when a composite resource is booked", () => {
    expect(units(whole, all)).toEqual(["a", "b", "c"]);
  });
  it("should occupy only itself when a part is booked", () => {
    expect(units(thirds[1], all)).toEqual(["b"]);
  });
  it("should accept one level and reject nested, missing or self parents", () => {
    expect(isValidHierarchy(all)).toBe(true);
    expect(isValidHierarchy([...all, { id: "x", parentId: "a" }])).toBe(false);
    expect(isValidHierarchy([{ id: "x", parentId: "missing" }])).toBe(false);
    expect(isValidHierarchy([{ id: "x", parentId: "x" }])).toBe(false);
  });
  it("should take one shared place of a part with a capacity and hold a composite outright", () => {
    const lanes = thirds.map((part) => ({ ...part, capacity: 6 }));
    const pool = [{ ...whole, capacity: null }, ...lanes];
    expect(occupancy(lanes[0], pool)).toEqual({ unitIds: ["a"], shared: true });
    expect(occupancy(pool[0], pool)).toEqual({
      unitIds: ["a", "b", "c"],
      shared: false,
    });
    expect(occupancy({ ...court, capacity: null }, all)).toEqual({
      unitIds: ["court"],
      shared: false,
    });
  });
});
