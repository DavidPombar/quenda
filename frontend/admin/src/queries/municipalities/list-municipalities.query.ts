// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { municipalitiesRepository } from "@/repositories/municipalities.repository";
export function useListMunicipalitiesQuery() {
  return useQuery({
    queryKey: ["municipalities"],
    queryFn: municipalitiesRepository.list,
  });
}
