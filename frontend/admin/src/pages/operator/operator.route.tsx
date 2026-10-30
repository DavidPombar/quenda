// SPDX-License-Identifier: AGPL-3.0-or-later
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { Operator } from "./operator.view";
import { deploymentRoute } from "./components/deployment/deployment.route";
import { deploymentInsightsRoute } from "./components/deployment-insights/deployment-insights.route";
import { deploymentWebAnalyticsRoute } from "./components/deployment-web-analytics/deployment-web-analytics.route";
export const operatorRoute = {
  path: ROUTES.operator,
  element: <Operator />,
  children: [
    { index: true, element: <Navigate to={ROUTES.deployment} replace /> },
    deploymentRoute,
    deploymentInsightsRoute,
    deploymentWebAnalyticsRoute,
  ],
};
