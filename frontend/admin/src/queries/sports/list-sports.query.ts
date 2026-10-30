// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { sportsRepository } from "@/repositories/sports.repository";
/** The municipality's sports catalogue, hidden entries included (#26). */
export function useListSportsQuery(enabled = true) {
  return useQuery({
    queryKey: ["sports"],
    queryFn: sportsRepository.list,
    enabled,
  });
}
