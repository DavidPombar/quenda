// SPDX-License-Identifier: AGPL-3.0-or-later
import { ROUTES } from "@/constants/routes";
import { Management } from "./management.view";
export const managementRoute = {
  path: ROUTES.management,
  element: <Management />,
};
