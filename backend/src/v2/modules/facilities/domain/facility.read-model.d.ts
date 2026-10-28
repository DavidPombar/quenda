// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Facility } from "./facility.entity";
import type { Resource } from "./resource.entity";
export interface FacilityDetails extends Facility {
  /** Ordered by position, then name. */
  resources: Resource[];
}
