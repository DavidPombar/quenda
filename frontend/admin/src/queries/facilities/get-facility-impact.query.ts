// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { facilitiesRepository } from "@/repositories/facilities.repository";
export function useGetFacilityImpactQuery(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["facility-impact", id],
    queryFn: () => facilitiesRepository.impact(id),
    enabled,
  });
}
