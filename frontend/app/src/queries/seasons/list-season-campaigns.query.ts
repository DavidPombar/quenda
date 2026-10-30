// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { seasonsRepository } from "@/repositories/seasons.repository";
export function useListSeasonCampaignsQuery(slug: string) {
  return useQuery({
    queryKey: ["season-campaigns", slug],
    queryFn: () => seasonsRepository.campaigns(slug),
  });
}
