// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { operatorRepository } from "@/repositories/operator.repository";
export function useListDeploymentQuery(operatorId: string | undefined) {
  return useQuery({
    queryKey: ["operator", "municipalities", operatorId],
    queryFn: operatorRepository.municipalities,
    enabled: !!operatorId,
  });
}
