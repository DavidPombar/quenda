// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { facilitiesRepository } from "@/repositories/facilities.repository";
export function useListFacilitiesQuery(slug: string) {
  return useQuery({
    queryKey: ["facilities", slug],
    queryFn: () => facilitiesRepository.list(slug),
  });
}
