// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { operatorRepository } from "@/repositories/operator.repository";
import type { DateRange } from "@/types/models";
export function useGetDeploymentWebAnalyticsQuery(
  operatorId: string | undefined,
  range: DateRange | undefined,
) {
  return useQuery({
    queryKey: ["operator", "web-analytics", operatorId, range?.from, range?.to],
    queryFn: () => operatorRepository.webAnalytics(range!),
    enabled: !!operatorId && !!range,
    // One quiet retry for a passing Umami hiccup before the page shows the error.
    retry: 1,
  });
}
