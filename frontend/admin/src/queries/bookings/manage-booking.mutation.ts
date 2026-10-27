// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsRepository } from "@/repositories/bookings.repository";
export function useManageBookingMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: bookingsRepository.manage,
    onSuccess: async () => {
      await Promise.all(
        ["managed-bookings", "availability", "insights", "audit"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
