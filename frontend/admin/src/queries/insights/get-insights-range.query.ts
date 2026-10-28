// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { insightsRepository } from "@/repositories/insights.repository";
import type { DateRange } from "@/types/models";
export function useGetInsightsRangeQuery(
  tenantId: string | undefined,
  range: DateRange | null,
) {
  return useQuery({
    queryKey: ["insights", tenantId, range?.from, range?.to],
    queryFn: () => insightsRepository.get(range ?? undefined),
    enabled: !!tenantId && !!range,
  });
}
