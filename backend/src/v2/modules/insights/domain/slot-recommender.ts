// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import type { WeeklyCell } from "./occupancy";
/** A free slot that could replace the one the person wanted. */
export interface SlotCandidate {
  facilityId: string;
  resourceId: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
  /** ISO weekday (1 = Monday) and local hour of the start, to look up the history. */
  weekday: number;
  hour: number;
}
export interface Suggestion extends SlotCandidate {
  /** Usual occupancy of that facility at that weekday and hour; null without history. */
  occupancyPct: number | null;
  sameFacility: boolean;
}
export interface RecommendArgs {
  /** The facility the person was looking at. */
  facilityId: string;
  /** The time they wanted, when there was one. */
  around: Temporal.Instant | null;
  candidates: SlotCandidate[];
  /** Usual occupancy by facility, weekday and hour (see `usualOccupancy`). */
  history: ReadonlyMap<string, number>;
  limit: number;
}
/**
 * Picks alternative slots. Swappable: an open-weights model could implement it later (criterion 4);
 * the default is a transparent heuristic over aggregated history, without personal data.
 */
export abstract class Recommender {
  abstract recommend(args: RecommendArgs): Suggestion[];
}
export function historyKey(facilityId: string, weekday: number, hour: number) {
  return `${facilityId}:${weekday}:${hour}`;
}
/** Booked over open time per facility × weekday × hour, summed over every week given. */
export function usualOccupancy(cells: readonly WeeklyCell[]) {
  const sums = new Map<string, { booked: number; open: number }>();
  for (const cell of cells) {
    const key = historyKey(cell.facilityId, cell.weekday, cell.hour);
    const sum = sums.get(key) ?? { booked: 0, open: 0 };
    sum.booked += cell.bookedMinutes;
    sum.open += cell.openMinutes;
    sums.set(key, sum);
  }
  const usual = new Map<string, number>();
  for (const [key, sum] of sums)
    if (sum.open > 0) usual.set(key, Math.round((sum.booked / sum.open) * 100));
  return usual;
}
/**
 * Least usually occupied first; ties go to the same facility, then to the time closest to the one
 * wanted. Slots without history follow, by closeness only. One slot per facility and start time.
 */
export class HistoricalOccupancyRecommender extends Recommender {
  recommend(args: RecommendArgs): Suggestion[] {
    const seen = new Set<string>();
    const suggestions: Suggestion[] = [];
    for (const candidate of args.candidates) {
      const key = `${candidate.facilityId}:${candidate.start.toString()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push({
        ...candidate,
        occupancyPct:
          args.history.get(
            historyKey(candidate.facilityId, candidate.weekday, candidate.hour),
          ) ?? null,
        sameFacility: candidate.facilityId === args.facilityId,
      });
    }
    const distance = (value: Suggestion) =>
      args.around
        ? Math.abs(
            value.start.epochMilliseconds - args.around.epochMilliseconds,
          )
        : value.start.epochMilliseconds;
    return suggestions
      .sort((a, b) => {
        if (a.occupancyPct === null || b.occupancyPct === null)
          return (
            Number(a.occupancyPct === null) - Number(b.occupancyPct === null) ||
            distance(a) - distance(b) ||
            Number(b.sameFacility) - Number(a.sameFacility)
          );
        return (
          a.occupancyPct - b.occupancyPct ||
          Number(b.sameFacility) - Number(a.sameFacility) ||
          distance(a) - distance(b) ||
          a.facilityId.localeCompare(b.facilityId)
        );
      })
      .slice(0, args.limit);
  }
}
