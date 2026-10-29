// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { planResources } from "./resource-plan";
import type { Resource } from "./resource.entity";
const resource = (
  id: string,
  parentId: string | null = null,
  active = true,
): Resource => ({
  id,
  tenantId: "t",
  facilityId: "f",
  name: id,
  position: 0,
  parentId,
  active,
});
const hall = [
  resource("whole"),
  resource("a", "whole"),
  resource("b", "whole"),
];
const draft = (r: Resource) => ({
  id: r.id,
  name: r.name,
  parentId: r.parentId,
  active: r.active,
});
const free = (id: string) => ({
  resourceId: id,
  upcoming: false,
  referenced: false,
});
const booked = (id: string) => ({
  resourceId: id,
  upcoming: true,
  referenced: true,
});
const past = (id: string) => ({
  resourceId: id,
  upcoming: false,
  referenced: true,
});
describe("Resource plan", () => {
  it("should save parents before their parts with positions from the requested order", () => {
    const result = planResources(
      [],
      [
        { id: "a", name: " Tercio A ", parentId: "whole", active: true },
        { id: "whole", name: "Pista completa", parentId: null, active: true },
      ],
      [],
    );
    expect(result).toEqual({
      plan: {
        save: [
          {
            id: "whole",
            name: "Pista completa",
            parentId: null,
            active: true,
            position: 1,
          },
          {
            id: "a",
            name: "Tercio A",
            parentId: "whole",
            active: true,
            position: 0,
          },
        ],
        remove: [],
      },
    });
  });
  it("should reject an empty set, blank or repeated names and nested parts", () => {
    const one = { id: "x", name: "Pista", parentId: null, active: true };
    expect(planResources([], [], [])).toEqual({
      error: { code: "validation" },
    });
    expect(planResources([], [{ ...one, name: "  " }], [])).toEqual({
      error: { code: "validation" },
    });
    expect(
      planResources([], [one, { ...one, id: "y", name: "PISTA" }], []),
    ).toEqual({ error: { code: "validation" } });
    expect(
      planResources(
        [],
        [
          one,
          { ...one, id: "y", name: "B", parentId: "x" },
          { ...one, id: "z", name: "C", parentId: "y" },
        ],
        [],
      ),
    ).toEqual({ error: { code: "validation" } });
  });
  it("should let free courts be renamed, split, reordered, removed and taken out of service", () => {
    const result = planResources(
      hall,
      [
        { id: "b", name: "Tercio B", parentId: null, active: false },
        { id: "whole", name: "Pista central", parentId: null, active: true },
      ],
      hall.map((r) => free(r.id)),
    );
    expect("plan" in result && result.plan.remove).toEqual(["a"]);
  });
  it("should refuse changes that alter the units of a court with upcoming reservations", () => {
    const usage = [booked("whole"), free("a"), free("b")];
    const keep = hall.map(draft);
    expect(planResources(hall, keep, usage)).toHaveProperty("plan");
    expect(
      planResources(
        hall,
        keep.map((r) => (r.id === "whole" ? { ...r, name: "Central" } : r)),
        usage,
      ),
    ).toHaveProperty("plan");
    for (const changed of [
      keep.filter((r) => r.id !== "b"),
      keep.map((r) => (r.id === "whole" ? { ...r, active: false } : r)),
      [...keep, { id: "c", name: "c", parentId: "whole", active: true }],
    ])
      expect(planResources(hall, changed, usage)).toEqual({
        error: { code: "resource_in_use", resourceId: "whole" },
      });
    expect(
      planResources(
        hall,
        keep.filter((r) => r.id !== "whole" && r.parentId === null),
        [booked("whole")],
      ),
    ).toEqual({ error: { code: "validation" } });
  });
  it("should refuse to remove a court with past reservations and allow taking it out of service", () => {
    const usage = [past("whole"), free("a"), free("b")];
    expect(
      planResources(
        hall,
        [{ id: "z", name: "Nova", parentId: null, active: true }],
        usage,
      ),
    ).toEqual({ error: { code: "resource_has_history", resourceId: "whole" } });
    expect(
      planResources(
        hall,
        hall.map((r) =>
          r.id === "whole" ? { ...draft(r), active: false } : draft(r),
        ),
        usage,
      ),
    ).toHaveProperty("plan");
  });
});
