// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { bookingsRepository } from "@/repositories/bookings.repository";
export function useGetPenaltyStandingQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["penalty", userId],
    queryFn: bookingsRepository.penalty,
    enabled: !!userId,
  });
}
