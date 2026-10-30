// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { facilitiesRepository } from "@/repositories/facilities.repository";
/** Every facility of the manager's municipality; only managers may read it. */
export function useListFacilitiesQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["facilities", slug],
    queryFn: () => facilitiesRepository.list(),
    enabled,
  });
}
