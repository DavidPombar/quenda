// SPDX-License-Identifier: AGPL-3.0-or-later
import { heatLevel, hoursLabel } from "@/services/insights.service";
import type { TextKey } from "@/services/i18n.service";
import type { Insights, Locale } from "@/types/models";
const WEEKDAYS = [
  [1, "mon"],
  [2, "tue"],
  [3, "wed"],
  [4, "thu"],
  [5, "fri"],
  [6, "sat"],
  [7, "sun"],
] as const satisfies readonly (readonly [number, TextKey])[];
export function OccupancyHeatmap(p: {
  insights: Insights;
  caption: string;
  /** Hour rows shared by compared heatmaps so they line up. */
  hours: number[];
  t: (key: TextKey) => string;
  locale: Locale;
}) {
  const { t } = p;
  const cells = new Map(
    p.insights.heatmap.map((cell) => [`${cell.weekday}-${cell.hour}`, cell]),
  );
  const id = `heatmap-${p.insights.from}-${p.insights.to}`;
  return (
    <div
      className="table-scroll heatmap-scroll"
      role="region"
      aria-labelledby={id}
      tabIndex={0}
    >
      <table className="heatmap">
        <caption id={id}>{p.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{t("insightsHour")}</th>
            {WEEKDAYS.map(([weekday, label]) => (
              <th key={weekday} scope="col">
                {t(label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {p.hours.map((hour) => (
            <tr key={hour}>
              <th scope="row">{`${String(hour).padStart(2, "0")}:00`}</th>
              {WEEKDAYS.map(([weekday]) => {
                const cell = cells.get(`${weekday}-${hour}`);
                return cell ? (
                  <td
                    key={weekday}
                    className={`heat heat-${heatLevel(cell.occupancy)}`}
                    title={`${hoursLabel(cell.bookedMinutes, p.locale)} / ${hoursLabel(cell.openMinutes, p.locale)}`}
                  >
                    {cell.occupancy} %
                  </td>
                ) : (
                  <td key={weekday} className="heat heat-closed">
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">{t("insightsClosed")}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
