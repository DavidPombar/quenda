// SPDX-License-Identifier: AGPL-3.0-or-later
import { ROUTES } from "@/constants/routes";
import { DeploymentInsights } from "./deployment-insights.view";
export const deploymentInsightsRoute = {
  path: ROUTES.deploymentInsights,
  element: <DeploymentInsights />,
};
