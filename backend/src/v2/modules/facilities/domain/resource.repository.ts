// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Resource } from "./resource.entity";
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
}
