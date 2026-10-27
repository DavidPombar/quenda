// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { categoriesRepository } from "@/repositories/categories.repository";
export function useListCategoryRequestsQuery(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["category-requests", tenantId],
    queryFn: categoriesRepository.pending,
    enabled: !!tenantId,
  });
}
