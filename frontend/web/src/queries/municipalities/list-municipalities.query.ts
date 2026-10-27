// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { catalogRepository } from "@/repositories/catalog.repository";
export function useListMunicipalitiesQuery() {
  return useQuery({
    queryKey: ["municipalities"],
    queryFn: catalogRepository.municipalities,
  });
}
