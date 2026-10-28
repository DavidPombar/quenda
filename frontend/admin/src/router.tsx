// SPDX-License-Identifier: AGPL-3.0-or-later
import { createBrowserRouter } from "react-router-dom";
import { homeRoute } from "@/pages/home/home.route";
import { shellRoute } from "@/pages/shell/shell.route";
import { operatorRoute } from "@/pages/operator/operator.route";
import { ADMIN_BASE_PATH } from "@/constants/routes";
export const router = createBrowserRouter(
  [homeRoute, operatorRoute, shellRoute],
  {
    basename: ADMIN_BASE_PATH,
  },
);
