// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Resource } from "@/types/models";
/**
 * Courts in display order: top-level resources by position, each followed by
 * its parts (one level only) so a composite reads before its thirds.
 */
export function orderResources(resources: Resource[]): Resource[] {
  const byPosition = [...resources].sort(
    (a, b) => a.position - b.position || a.name.localeCompare(b.name),
  );
  const ids = new Set(byPosition.map((resource) => resource.id));
  const roots = byPosition.filter(
    (resource) => !resource.parentId || !ids.has(resource.parentId),
  );
  return roots.flatMap((root) => [
    root,
    ...byPosition.filter((resource) => resource.parentId === root.id),
  ]);
}
/** "Pista completa › Tercio A" for parts, the plain name otherwise. */
export function resourceLabel(resource: Resource, resources: Resource[]) {
  const parent = resource.parentId
    ? resources.find((item) => item.id === resource.parentId)
    : undefined;
  return parent ? `${parent.name} › ${resource.name}` : resource.name;
}
/**
 * The court name worth showing next to its facility, or "" when the single
 * default resource carries the facility's own name (V0 facilities).
 */
export function distinctResource(facilityName: string, resourceName?: string) {
  return resourceName && resourceName !== facilityName ? resourceName : "";
}
