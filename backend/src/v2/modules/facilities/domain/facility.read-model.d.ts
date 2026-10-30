// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Facility } from "./facility.entity";
import type { Resource } from "./resource.entity";
import type { FacilityPhoto } from "./facility-photo.entity";
import type { OpeningDay } from "./opening-week";
export interface FacilityDetails extends Facility {
  /** Ordered by position, then name. */
  resources: Resource[];
  /** Name of the sport in the municipality's catalogue (#26). */
  sportName: { gl: string; es: string };
  /** Ordered by position. */
  photos: FacilityPhoto[];
}
export interface FacilityPage {
  items: FacilityDetails[];
  total: number;
  page: number;
  pageSize: number;
}
export interface FacilityWithSchedule extends FacilityDetails {
  /** Opening hours of the next seven local days, from today. */
  openingWeek: OpeningDay[];
}
