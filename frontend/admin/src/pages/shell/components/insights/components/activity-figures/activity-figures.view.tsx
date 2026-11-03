// SPDX-License-Identifier: AGPL-3.0-or-later
import { percentLabel } from "@/services/insights.service";
import { fill, type TextKey } from "@/services/i18n.service";
import type { ActivityFigures as Figures } from "@/types/models";
/** Places, enrolment and attendance per activity in the period (#97, part D). */
export function ActivityFigures(p: {
  activities: Figures[];
  t: (key: TextKey) => string;
}) {
  const { t } = p;
  if (p.activities.length === 0)
    return (
      <section aria-labelledby="activity-figures-title">
        <h2 id="activity-figures-title">{t("insightsActivities")}</h2>
        <p className="section-hint">{t("insightsActivitiesEmpty")}</p>
      </section>
    );
  return (
    <div
      className="table-scroll"
      role="region"
      aria-labelledby="activity-figures-caption"
      tabIndex={0}
    >
      <table className="audit-table">
        <caption id="activity-figures-caption">
          {t("insightsActivities")}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t("insightsActivity")}</th>
            <th scope="col">{t("insightsFacility")}</th>
            <th scope="col">{t("insightsPlaces")}</th>
            <th scope="col">{t("insightsEnrolled")}</th>
            <th scope="col">{t("insightsWaiting")}</th>
            <th scope="col">{t("insightsSessions")}</th>
            <th scope="col">{t("insightsAttendance")}</th>
          </tr>
        </thead>
        <tbody>
          {p.activities.map((activity) => (
            <tr key={activity.id}>
              <th scope="row">{activity.name}</th>
              <td>{activity.facilityName}</td>
              <td>{activity.places}</td>
              <td>{activity.enrolled}</td>
              <td>{activity.waiting}</td>
              <td>
                {activity.sessions} ({activity.cancelledSessions})
              </td>
              <td>
                {activity.attendanceRate === null
                  ? t("insightsNoRoll")
                  : fill("{rate} ({present}/{total})", {
                      rate: percentLabel(activity.attendanceRate),
                      present: activity.present,
                      total: activity.present + activity.absent,
                    })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
