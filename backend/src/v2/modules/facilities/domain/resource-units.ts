// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Resource } from "./resource.entity";
type Node = Pick<Resource, "id" | "parentId">;
/**
 * Units are the resources without parts. A simple resource or a part occupies itself; a composite
 * occupies all its parts. So the whole court clashes with every part, and two parts do not clash.
 */
export function units(resource: Node, all: readonly Node[]): string[] {
  const parts = all
    .filter((other) => other.parentId === resource.id)
    .map((other) => other.id);
  return parts.length ? parts : [resource.id];
}
/** One level only: a parent exists in the same set, is not itself a part and is not the resource. */
export function isValidHierarchy(all: readonly Node[]): boolean {
  const byId = new Map(all.map((resource) => [resource.id, resource]));
  return all.every((resource) => {
    if (resource.parentId === null) return true;
    const parent = byId.get(resource.parentId);
    return (
      parent !== undefined &&
      parent.id !== resource.id &&
      parent.parentId === null
    );
  });
}
