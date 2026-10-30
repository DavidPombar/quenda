// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { staffRepository } from "@/repositories/staff.repository";
/** Managers and door staff with their account state (#8). */
export function useListStaffQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["staff"],
    queryFn: staffRepository.list,
    enabled,
  });
}
