// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Resource } from "./resource.entity";
import { isValidHierarchy, units } from "./resource-units";
export type ResourceDraft = Pick<
  Resource,
  "id" | "name" | "parentId" | "active"
>;
export interface ResourceUsage {
  resourceId: string;
  /** A confirmed reservation that has not ended books it or occupies it as a unit. */
  upcoming: boolean;
  /** Any reservation, past or future, references it, so its row must stay. */
  referenced: boolean;
}
export type ResourcePlanError =
  | { code: "validation" }
  | { code: "resource_in_use"; resourceId: string }
  | { code: "resource_has_history"; resourceId: string };
export interface ResourcePlan {
  /** Every requested resource, parents before their parts, with its position. */
  save: Omit<Resource, "tenantId" | "facilityId">[];
  remove: string[];
}
const MAX_NAME = 80;
/**
 * Checks a facility's complete new set of courts against the current one (M1). Courts with
 * upcoming reservations cannot be removed, taken out of service, moved under another court or
 * split, because the reservations would no longer match the units they hold. A court with any
 * reservation history cannot be removed either; it can be taken out of service instead.
 */
export function planResources(
  current: readonly Resource[],
  requested: readonly ResourceDraft[],
  usage: readonly ResourceUsage[],
): { plan: ResourcePlan } | { error: ResourcePlanError } {
  const names = requested.map((item) => item.name.trim().toLocaleLowerCase());
  if (
    !requested.length ||
    names.some((name) => !name || name.length > MAX_NAME) ||
    new Set(names).size !== names.length ||
    new Set(requested.map((item) => item.id)).size !== requested.length ||
    !isValidHierarchy(requested)
  )
    return { error: { code: "validation" } };
  const used = new Map(usage.map((item) => [item.resourceId, item]));
  const requestedById = new Map(requested.map((item) => [item.id, item]));
  for (const resource of current) {
    const next = requestedById.get(resource.id);
    const state = used.get(resource.id);
    if (!next) {
      if (state?.upcoming)
        return { error: { code: "resource_in_use", resourceId: resource.id } };
      if (state?.referenced)
        return {
          error: { code: "resource_has_history", resourceId: resource.id },
        };
      continue;
    }
    if (!state?.upcoming) continue;
    const before = units(resource, current);
    const after = units(next, requested);
    if (
      !next.active ||
      next.parentId !== resource.parentId ||
      before.length !== after.length ||
      before.some((id) => !after.includes(id))
    )
      return { error: { code: "resource_in_use", resourceId: resource.id } };
  }
  const position = new Map(requested.map((item, index) => [item.id, index]));
  return {
    plan: {
      save: [...requested]
        .sort(
          (a, b) =>
            Number(a.parentId !== null) - Number(b.parentId !== null) ||
            position.get(a.id)! - position.get(b.id)!,
        )
        .map((item) => ({
          id: item.id,
          name: item.name.trim(),
          parentId: item.parentId,
          active: item.active,
          position: position.get(item.id)!,
        })),
      remove: current
        .filter((resource) => !requestedById.has(resource.id))
        .map((resource) => resource.id),
    },
  };
}
