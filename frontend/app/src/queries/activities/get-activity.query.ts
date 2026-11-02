// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { activitiesRepository } from "@/repositories/activities.repository";
export function useGetActivityQuery(slug: string, id: string) {
  return useQuery({
    queryKey: ["activity", slug, id],
    queryFn: () => activitiesRepository.get({ slug, id }),
  });
}
