// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { bookingsRepository } from "@/repositories/bookings.repository";
export function useGetCredentialQuery(id: string) {
  return useQuery({
    queryKey: ["credential", id],
    queryFn: () => bookingsRepository.credential(id),
    // The key can be rotated by the municipality; refresh whenever the QR is shown again.
    staleTime: 0,
  });
}
