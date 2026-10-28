// SPDX-License-Identifier: AGPL-3.0-or-later
import { ROUTES } from "@/constants/routes";
import { Deployment } from "./deployment.view";
export const deploymentRoute = {
  path: ROUTES.deployment,
  element: <Deployment />,
};
