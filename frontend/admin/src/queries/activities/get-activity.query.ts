// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { activitiesRepository } from "@/repositories/activities.repository";
/** One activity with its dated sessions. */
export function useGetActivityQuery(id: string | null) {
  return useQuery({
    queryKey: ["activities", id],
    queryFn: () => activitiesRepository.get(id!),
    enabled: !!id,
  });
}
