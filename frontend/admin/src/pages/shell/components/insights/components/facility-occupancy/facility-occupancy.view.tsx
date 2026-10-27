// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  hoursLabel,
  percentLabel,
  pointsDelta,
} from "@/services/insights.service";
import type { TextKey } from "@/services/i18n.service";
import type { Insights, Locale } from "@/types/models";
export function FacilityOccupancy(p: {
  current: Insights;
  previous: Insights | null;
  t: (key: TextKey) => string;
  locale: Locale;
}) {
  const { t, current, previous } = p;
  const before = (id: string) =>
    previous?.byFacility.find((facility) => facility.id === id)?.occupancy ??
    null;
  return (
    <div
      className="table-scroll"
      role="region"
      aria-labelledby="facility-occupancy-caption"
      tabIndex={0}
    >
      <table className="audit-table facility-occupancy">
        <caption id="facility-occupancy-caption">
          {t("insightsByFacility")}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t("insightsFacility")}</th>
            <th scope="col">{t("insightsOccupancy")}</th>
            {previous && <th scope="col">{t("insightsBefore")}</th>}
            {previous && <th scope="col">{t("insightsDelta")}</th>}
            <th scope="col">{t("insightsBookedHours")}</th>
            <th scope="col">{t("insightsOpenHours")}</th>
            <th scope="col">{t("insightsConfirmed")}</th>
            <th scope="col">{t("insightsCancelled")}</th>
            <th scope="col">{t("insightsNoShows")}</th>
          </tr>
        </thead>
        <tbody>
          {current.byFacility.map((facility) => (
            <tr key={facility.id}>
              <th scope="row">{facility.name}</th>
              <td>
                <span className="occupancy-cell">
                  <span className="occupancy-value">
                    {percentLabel(facility.occupancy)}
                  </span>
                  <span
                    className={`usage-bar ${facility.sport}`}
                    aria-hidden="true"
                  >
                    <span
                      style={{
                        width: `${Math.min(100, facility.occupancy ?? 0)}%`,
                      }}
                    />
                  </span>
                </span>
              </td>
              {previous && <td>{percentLabel(before(facility.id))}</td>}
              {previous && (
                <td>
                  {pointsDelta(facility.occupancy, before(facility.id)) ?? "—"}
                </td>
              )}
              <td>{hoursLabel(facility.bookedMinutes, p.locale)}</td>
              <td>{hoursLabel(facility.openMinutes, p.locale)}</td>
              <td>{facility.confirmed}</td>
              <td>{facility.cancelled}</td>
              <td>{facility.noShows}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
