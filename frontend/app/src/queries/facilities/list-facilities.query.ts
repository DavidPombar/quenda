// SPDX-License-Identifier: AGPL-3.0-or-later
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { facilitiesRepository } from "@/repositories/facilities.repository";
import type { FacilityFilters } from "@/types/models";
export function useListFacilitiesQuery(slug: string, filters: FacilityFilters) {
  return useQuery({
    queryKey: ["facilities", slug, filters],
    queryFn: () => facilitiesRepository.list(slug, filters),
    placeholderData: keepPreviousData,
  });
}
