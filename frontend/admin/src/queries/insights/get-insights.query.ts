// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { insightsRepository } from "@/repositories/insights.repository";
export function useGetInsightsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["insights", userId],
    queryFn: () => insightsRepository.get(),
    enabled: !!userId,
  });
}
