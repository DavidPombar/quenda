// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { seasonsRepository } from "@/repositories/seasons.repository";
export function useGetMyClubQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-club", userId],
    queryFn: seasonsRepository.myClub,
    enabled: !!userId,
  });
}
