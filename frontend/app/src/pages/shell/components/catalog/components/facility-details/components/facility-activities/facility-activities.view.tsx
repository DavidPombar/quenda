// SPDX-License-Identifier: AGPL-3.0-or-later
import { Link } from "react-router-dom";
import { ROUTES, routeFor } from "@/constants/routes";
import { localized } from "@/services/catalog.service";
import { scheduleLabel } from "@/services/activity.service";
import type { TextKey } from "@/services/i18n.service";
import type { Locale } from "@/types/models";
import { useFacilityActivitiesController } from "./facility-activities.controller";
/** Activities held at this facility (#97), linking to their pages and to the full list. */
export function FacilityActivities(p: {
  slug: string;
  facilityId: string;
  locale: Locale;
  t: (key: TextKey) => string;
}) {
  const c = useFacilityActivitiesController(p);
  if (!c.activities.length) return null;
  return (
    <>
      <h3>{p.t("facilityActivities")}</h3>
      <ul className="facility-activity-list">
        {c.activities.map((activity) => (
          <li key={activity.id}>
            <Link
              to={routeFor(p.slug, `${ROUTES.activities}/${activity.id}`)}
            >
              {localized(activity.name, p.locale)}
            </Link>{" "}
            <span className="muted">
              {scheduleLabel(activity, p.t, p.locale)}
            </span>
          </li>
        ))}
      </ul>
      {c.total > c.activities.length && (
        <Link
          to={`${routeFor(p.slug, ROUTES.activities)}?instalacion=${encodeURIComponent(p.facilityId)}`}
        >
          {p.t("allFacilityActivities")}
        </Link>
      )}
    </>
  );
}
