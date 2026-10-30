// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { MunicipalityInsights } from "./municipality-insights";
import { usualOccupancy } from "../domain/slot-recommender";
import { Clock } from "../../../shared/application/clock";
import { MunicipalitySettings } from "../../../shared/application/municipality-settings";
/** Weeks of history behind the suggestions: the same ones published as open data (#21). */
export const HISTORY_WEEKS = 12;
/**
 * Usual occupancy by facility × weekday × hour over the last complete weeks. It changes once a week
 * at most, so each municipality's map is computed once per local day and kept in memory.
 */
@Injectable()
export class OccupancyHistory {
  private readonly cache = new Map<
    string,
    { day: string; value: Promise<Map<string, number>> }
  >();
  constructor(
    private readonly insights: MunicipalityInsights,
    private readonly clock: Clock,
  ) {}
  usual(settings: MunicipalitySettings): Promise<Map<string, number>> {
    const day = this.clock
      .now()
      .toZonedDateTimeISO(settings.timezone)
      .toPlainDate()
      .toString();
    const cached = this.cache.get(settings.id);
    if (cached?.day === day) return cached.value;
    const value = this.insights
      .weekly(
        settings,
        this.insights.recentWeeks(settings.timezone, HISTORY_WEEKS),
      )
      .then(({ cells }) => usualOccupancy(cells));
    // A failed calculation is not kept, so the next request tries again.
    value.catch(() => this.cache.delete(settings.id));
    this.cache.set(settings.id, { day, value });
    return value;
  }
}
