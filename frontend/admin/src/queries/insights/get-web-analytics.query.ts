// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { insightsRepository } from "@/repositories/insights.repository";
import type { DateRange } from "@/types/models";
export function useGetWebAnalyticsQuery(
  tenantId: string | undefined,
  range: DateRange | null,
) {
  return useQuery({
    queryKey: ["web-analytics", tenantId, range?.from, range?.to],
    queryFn: () => insightsRepository.webAnalytics(range!),
    enabled: !!tenantId && !!range,
    // One quiet retry for a passing Umami hiccup before the page shows the error.
    retry: 1,
  });
}
