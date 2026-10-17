// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { bookingsRepository } from "@/repositories/bookings.repository";
export function useListNotificationsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: bookingsRepository.notifications,
    enabled: !!userId,
  });
}
