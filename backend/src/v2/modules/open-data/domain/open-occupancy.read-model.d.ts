// SPDX-License-Identifier: AGPL-3.0-or-later
import type { WeeklyCell } from "../../insights/domain/occupancy";
import type { OpenPublication } from "./open-facility.read-model";
/**
 * Aggregated occupancy (#21, Münster and Paris model): minutes per facility × ISO week ×
 * weekday × local hour. No booking, person or court identifiers are published.
 */
export interface OpenOccupancy extends OpenPublication {
  timezone: string;
  /** First and last included local dates. */
  from: string;
  to: string;
  facilities: { id: string; name: string; sport: string }[];
  cells: WeeklyCell[];
}
