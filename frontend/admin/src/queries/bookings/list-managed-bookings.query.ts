// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { bookingsRepository } from "@/repositories/bookings.repository";
export function useListManagedBookingsQuery(
  tenantId: string | undefined,
  filters: { date: string; facilityId?: string },
) {
  return useQuery({
    queryKey: ["managed-bookings", tenantId, filters],
    queryFn: () => bookingsRepository.listDay(filters),
    enabled: !!tenantId,
  });
}
