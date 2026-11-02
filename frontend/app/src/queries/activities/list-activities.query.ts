// SPDX-License-Identifier: AGPL-3.0-or-later
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { activitiesRepository } from "@/repositories/activities.repository";
import type { ActivityFilters } from "@/types/models";
/** One page of the municipality's activities (#97). */
export function useListActivitiesQuery(slug: string, filters: ActivityFilters) {
  return useQuery({
    queryKey: ["activities", slug, filters],
    queryFn: () => activitiesRepository.list(slug, filters),
    placeholderData: keepPreviousData,
  });
}
