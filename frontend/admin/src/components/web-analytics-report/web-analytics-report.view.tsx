// SPDX-License-Identifier: AGPL-3.0-or-later
import type { TextKey } from "@/services/i18n.service";
import { percentLabel } from "@/services/insights.service";
import {
  countLabel,
  durationLabel,
  rankedLabel,
} from "@/services/web-analytics.service";
import type { Locale, SiteReport } from "@/types/models";
const LISTS = [
  ["pages", "webPages"],
  ["events", "webEvents"],
  ["referrers", "webReferrers"],
  ["devices", "webDevices"],
  ["languages", "webLanguages"],
] as const satisfies readonly (readonly [keyof SiteReport, TextKey])[];
/** Totals and top lists of one site, shared by the operator and the manager views (#57). */
export function WebAnalyticsReport(p: {
  report: SiteReport;
  /** Prefix for element ids, unique on the page. */
  id: string;
  t: (key: TextKey) => string;
  locale: Locale;
}) {
  const { t, report, locale } = p;
  const cards: { label: TextKey; value: string }[] = [
    { label: "webVisitors", value: countLabel(report.visitors, locale) },
    { label: "webVisits", value: countLabel(report.visits, locale) },
    { label: "webPageviews", value: countLabel(report.pageviews, locale) },
    { label: "webBounce", value: percentLabel(report.bounceRate) },
    { label: "webDuration", value: durationLabel(report.averageVisitSeconds) },
  ];
  return (
    <div className="web-analytics-report">
      <dl className="stats-strip insight-totals">
        {cards.map((card) => (
          <div key={card.label} className="stat">
            <dt>{t(card.label)}</dt>
            <dd className="stat-value">{card.value}</dd>
          </div>
        ))}
      </dl>
      <div className="web-analytics-lists">
        {LISTS.map(([list, title]) => (
          <div
            key={list}
            className="table-scroll"
            role="region"
            aria-labelledby={`${p.id}-${list}`}
            tabIndex={0}
          >
            <table className="audit-table">
              <caption id={`${p.id}-${list}`}>{t(title)}</caption>
              <thead>
                <tr>
                  <th scope="col">{t(title)}</th>
                  <th scope="col">{t("webCount")}</th>
                </tr>
              </thead>
              <tbody>
                {report[list].length ? (
                  report[list].map((row) => (
                    <tr key={row.value}>
                      <th scope="row">
                        {rankedLabel(list, row.value, t, locale)}
                      </th>
                      <td>{countLabel(row.count, locale)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2}>{t("webNoData")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
