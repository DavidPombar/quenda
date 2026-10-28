// SPDX-License-Identifier: AGPL-3.0-or-later
import { ROUTES } from "@/constants/routes";
import { AccessControl } from "./access-control.view";
export const accessControlRoute = {
  path: ROUTES.access,
  element: <AccessControl />,
};
