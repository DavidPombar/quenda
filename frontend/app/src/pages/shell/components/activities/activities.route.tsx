// SPDX-License-Identifier: AGPL-3.0-or-later
import { ROUTES } from "@/constants/routes";
import { Activities } from "./activities.view";
import { activityDetailsRoute } from "./components/activity-details/activity-details.route";
export const activitiesRoute = {
  path: ROUTES.activities,
  children: [{ index: true, element: <Activities /> }, activityDetailsRoute],
};
