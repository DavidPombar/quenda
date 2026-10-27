// SPDX-License-Identifier: AGPL-3.0-or-later
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { Shell } from "./shell.view";
import { catalogRoute } from "./components/catalog/catalog.route";
import { myBookingsRoute } from "./components/my-bookings/my-bookings.route";
import { accountRoute } from "./components/account/account.route";
import { accessibilityRoute } from "./components/accessibility/accessibility.route";
import { unsubscribeRoute } from "./components/unsubscribe/unsubscribe.route";
export const shellRoute = {
  path: ROUTES.shell,
  element: <Shell />,
  children: [
    { index: true, element: <Navigate to={ROUTES.catalog} replace /> },
    catalogRoute,
    myBookingsRoute,
    accountRoute,
    accessibilityRoute,
    unsubscribeRoute,
  ],
};
