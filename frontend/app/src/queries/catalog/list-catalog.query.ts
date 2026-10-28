// SPDX-License-Identifier: AGPL-3.0-or-later
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { catalogRepository } from "@/repositories/catalog.repository";
import type { CatalogFilters } from "@/types/models";
export function useListCatalogQuery(filters: CatalogFilters) {
  return useQuery({
    queryKey: ["catalog", filters],
    queryFn: () => catalogRepository.list(filters),
    placeholderData: keepPreviousData,
  });
}
