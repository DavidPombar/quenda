// SPDX-License-Identifier: AGPL-3.0-or-later
import { ROUTES } from "@/constants/routes";
import { Settings } from "./settings.view";
export const settingsRoute = {
  path: ROUTES.settings,
  element: <Settings />,
};
