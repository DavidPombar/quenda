// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { bookingsRepository } from "@/repositories/bookings.repository";
export function useListBookingsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["bookings", userId],
    queryFn: bookingsRepository.list,
    enabled: !!userId,
  });
}
