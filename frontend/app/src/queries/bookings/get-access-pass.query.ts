// SPDX-License-Identifier: AGPL-3.0-or-later
import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";
import { bookingsRepository } from "@/repositories/bookings.repository";
// Issuing is idempotent; the cached pass can be shown again without a network.
function accessPassQuery(bookingId: string) {
  return queryOptions({
    queryKey: ["access-pass", bookingId],
    queryFn: () => bookingsRepository.accessPass(bookingId),
    staleTime: Infinity,
  });
}
export function useGetAccessPassQuery(bookingId: string) {
  return useQuery(accessPassQuery(bookingId));
}
/** Fetches the passes of the next bookings ahead, so the door QR opens offline too (#24). */
export function usePrefetchAccessPasses(bookingIds: string[]) {
  useQueries({ queries: bookingIds.map(accessPassQuery) });
}
