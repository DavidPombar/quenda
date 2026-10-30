// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { sportsRepository } from "@/repositories/sports.repository";
/** The municipality's whole catalogue; only for a signed-in manager. */
export function useListSportsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["sports", userId],
    queryFn: sportsRepository.list,
    enabled: !!userId,
  });
}
