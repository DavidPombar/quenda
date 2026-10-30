// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { facilitiesRepository } from "@/repositories/facilities.repository";
export function useGetMapSettingsQuery() {
  return useQuery({
    queryKey: ["map-settings"],
    queryFn: () => facilitiesRepository.map(),
    staleTime: Infinity,
  });
}
