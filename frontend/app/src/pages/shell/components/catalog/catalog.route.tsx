// SPDX-License-Identifier: AGPL-3.0-or-later
import { ROUTES } from "@/constants/routes";
import { Catalog } from "./catalog.view";
import { facilityDetailsRoute } from "./components/facility-details/facility-details.route";
export const catalogRoute = {
  path: ROUTES.catalog,
  children: [{ index: true, element: <Catalog /> }, facilityDetailsRoute],
};
