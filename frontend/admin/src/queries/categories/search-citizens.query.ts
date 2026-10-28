// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { categoriesRepository } from "@/repositories/categories.repository";
/** Runs once the manager has typed at least two characters. */
export function useSearchCitizensQuery(query: string) {
  return useQuery({
    queryKey: ["citizens", query],
    queryFn: () => categoriesRepository.search(query),
    enabled: query.trim().length >= 2,
  });
}
