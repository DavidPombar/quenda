// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { seasonsRepository } from "@/repositories/seasons.repository";
export function useListAllocationsQuery(campaignId: string) {
  return useQuery({
    queryKey: ["season-allocations", campaignId],
    queryFn: () => seasonsRepository.allocations(campaignId),
    enabled: !!campaignId,
  });
}
