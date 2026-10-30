// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { sportsRepository } from "@/repositories/sports.repository";
export function useListSportsQuery(municipalities: string[]) {
  return useQuery({
    queryKey: ["sports", municipalities],
    queryFn: () => sportsRepository.list(municipalities),
  });
}
