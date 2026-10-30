// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Facility } from "./facility.entity";
import type { Resource } from "./resource.entity";
import type { SportArt, SportName } from "./sport.entity";
/** How a facility's sport is shown: its name in both languages and its illustration. */
export interface SportLabel {
  sportName: SportName;
  sportArt: SportArt;
}
export interface FacilityDetails extends Facility, SportLabel {
  /** Ordered by position, then name. */
  resources: Resource[];
}
