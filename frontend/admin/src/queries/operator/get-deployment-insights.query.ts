// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { operatorRepository } from "@/repositories/operator.repository";
import type { DateRange } from "@/types/models";
export function useGetDeploymentInsightsQuery(
  operatorId: string | undefined,
  range: DateRange | undefined,
) {
  return useQuery({
    queryKey: ["operator", "insights", operatorId, range?.from, range?.to],
    queryFn: () => operatorRepository.insights(range!),
    enabled: !!operatorId && !!range,
  });
}
