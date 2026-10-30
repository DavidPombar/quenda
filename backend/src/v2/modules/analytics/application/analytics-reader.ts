// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Ranked, UmamiTotals } from "../domain/web-analytics.read-model";
export interface ReadRange {
  /** Epoch milliseconds, end exclusive. */
  startAt: number;
  endAt: number;
}
/** Umami v2 metric types; pages are `url` there. */
export type MetricType = "url" | "referrer" | "device" | "language" | "event";
/** Read-only access to the deployment's Umami statistics (#57). */
export abstract class AnalyticsReader {
  /** Throws when Umami cannot be reached or refuses the reader's credentials. */
  abstract totals(
    website: string,
    range: ReadRange,
    tag: string | null,
  ): Promise<UmamiTotals>;
  abstract metric(
    website: string,
    type: MetricType,
    range: ReadRange,
    tag: string | null,
  ): Promise<Ranked[]>;
}
