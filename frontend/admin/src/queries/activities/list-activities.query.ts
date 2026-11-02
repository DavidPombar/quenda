// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { activitiesRepository } from "@/repositories/activities.repository";
/** Every activity of the manager's municipality, drafts and cancelled ones included (#97). */
export function useListActivitiesQuery(enabled = true) {
  return useQuery({
    queryKey: ["activities"],
    queryFn: activitiesRepository.list,
    enabled,
  });
}
