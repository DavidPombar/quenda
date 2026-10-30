// SPDX-License-Identifier: AGPL-3.0-or-later
import { ROUTES } from "@/constants/routes";
import { DeploymentWebAnalytics } from "./deployment-web-analytics.view";
export const deploymentWebAnalyticsRoute = {
  path: ROUTES.deploymentWebAnalytics,
  element: <DeploymentWebAnalytics />,
};
