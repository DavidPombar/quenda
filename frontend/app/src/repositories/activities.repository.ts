// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import { activitiesQuery } from "@/services/activity.service";
import type {
  ActivityFilters,
  ActivityPage,
  PublicActivityDetails,
} from "@/types/models";
export const activitiesRepository = {
  list: (slug: string, filters: ActivityFilters) =>
    apiClient.request<ActivityPage>(
      `public/activities?${activitiesQuery(slug, filters)}`,
    ),
  get: (args: { slug: string; id: string }) =>
    apiClient.request<PublicActivityDetails>(
      `public/activities/${encodeURIComponent(args.id)}?${new URLSearchParams({ slug: args.slug })}`,
    ),
};
