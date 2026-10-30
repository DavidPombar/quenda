// SPDX-License-Identifier: AGPL-3.0-or-later
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { Shell } from "./shell.view";
import { managementRoute } from "./components/management/management.route";
import { auditRoute } from "./components/audit/audit.route";
import { insightsRoute } from "./components/insights/insights.route";
import { accessibilityRoute } from "./components/accessibility/accessibility.route";
import { settingsRoute } from "./components/settings/settings.route";
import { categoriesRoute } from "./components/categories/categories.route";
import { bookingsRoute } from "./components/bookings/bookings.route";
import { seasonsRoute } from "./components/seasons/seasons.route";
import { staffRoute } from "./components/staff/staff.route";
import { accessControlRoute } from "./components/access-control/access-control.route";
export const shellRoute = {
  path: ROUTES.shell,
  element: <Shell />,
  children: [
    { index: true, element: <Navigate to={ROUTES.management} replace /> },
    managementRoute,
    bookingsRoute,
    seasonsRoute,
    staffRoute,
    accessControlRoute,
    auditRoute,
    insightsRoute,
    categoriesRoute,
    accessibilityRoute,
    settingsRoute,
  ],
};
