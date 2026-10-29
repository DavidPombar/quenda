// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { seasonsRepository } from "@/repositories/seasons.repository";
export function useListCampaignsQuery(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["season-campaigns", tenantId],
    queryFn: seasonsRepository.campaigns,
    enabled: !!tenantId,
  });
}
