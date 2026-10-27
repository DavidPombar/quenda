// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { bookingsRepository } from "@/repositories/bookings.repository";
// Issuing is idempotent; the cached pass can be shown again without a network.
export function useGetAccessPassQuery(bookingId: string) {
  return useQuery({
    queryKey: ["access-pass", bookingId],
    queryFn: () => bookingsRepository.accessPass(bookingId),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
