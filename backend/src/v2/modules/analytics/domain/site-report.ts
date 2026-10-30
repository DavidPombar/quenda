// SPDX-License-Identifier: AGPL-3.0-or-later
import type {
  Ranked,
  SiteReport,
  UmamiTotals,
} from "./web-analytics.read-model";
/** Rows shown per list: enough to read, small enough to stay aggregate. */
export const TOP = 10;
/** Umami's totals and lists as the dashboards show them. */
export function siteReport(
  totals: UmamiTotals,
  lists: Pick<
    SiteReport,
    "pages" | "referrers" | "devices" | "languages" | "events"
  >,
): SiteReport {
  const top = (rows: Ranked[]) =>
    rows
      .filter((row) => row.value !== "")
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP);
  return {
    visitors: totals.visitors,
    visits: totals.visits,
    pageviews: totals.pageviews,
    bounceRate: totals.visits
      ? Math.round(
          (Math.min(totals.bounces, totals.visits) / totals.visits) * 100,
        )
      : null,
    averageVisitSeconds: totals.visits
      ? Math.round(totals.totaltime / totals.visits)
      : null,
    pages: top(lists.pages),
    referrers: top(lists.referrers),
    devices: top(lists.devices),
    languages: top(lists.languages),
    events: top(lists.events),
  };
}
