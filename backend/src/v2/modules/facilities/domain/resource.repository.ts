// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { Resource } from "./resource.entity";
import type { ResourcePlan, ResourceUsage } from "./resource-plan";
export abstract class ResourceRepository {
  /** Every resource of the municipality, ordered by facility, position and name. */
  abstract listByTenant(tenantId: string): Promise<Resource[]>;
  /** Resources of one facility, ordered by position and name. */
  abstract listByFacility(
    tenantId: string,
    facilityId: string,
  ): Promise<Resource[]>;
  /** Inserts the resource unless its id already exists. */
  abstract add(resource: Resource): Promise<void>;
  /** Of `ids`, those already used by a resource of another facility or municipality. */
  abstract foreignIds(
    tenantId: string,
    facilityId: string,
    ids: readonly string[],
  ): Promise<string[]>;
  /** How reservations use each resource of the facility at `now`. */
  abstract usage(
    tenantId: string,
    facilityId: string,
    now: Temporal.Instant,
  ): Promise<ResourceUsage[]>;
  /** Applies a validated plan: upserts in order, then deletes removed resources (parts first). */
  abstract apply(
    tenantId: string,
    facilityId: string,
    plan: ResourcePlan,
  ): Promise<void>;
}
