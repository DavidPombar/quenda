// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { facilitiesRepository } from "@/repositories/facilities.repository";
export function useListSportsQuery(municipalities: readonly string[]) {
  return useQuery({
    queryKey: ["sports", municipalities],
    queryFn: () => facilitiesRepository.sports(municipalities),
    staleTime: 5 * 60 * 1000,
  });
}
