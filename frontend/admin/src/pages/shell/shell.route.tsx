// SPDX-License-Identifier: AGPL-3.0-or-later
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { Shell } from "./shell.view";
import { managementRoute } from "./components/management/management.route";
import { auditRoute } from "./components/audit/audit.route";
import { settingsRoute } from "./components/settings/settings.route";
import { bookingsRoute } from "./components/bookings/bookings.route";
import { accessRoute } from "./components/access/access.route";
export const shellRoute = {
  path: ROUTES.shell,
  element: <Shell />,
  children: [
    { index: true, element: <Navigate to={ROUTES.management} replace /> },
    managementRoute,
    bookingsRoute,
    accessRoute,
    auditRoute,
    settingsRoute,
  ],
};
