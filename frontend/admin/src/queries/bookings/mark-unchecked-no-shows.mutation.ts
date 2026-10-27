// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsRepository } from "@/repositories/bookings.repository";
export function useMarkUncheckedNoShowsMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: bookingsRepository.markUncheckedNoShows,
    onSuccess: async () => {
      await Promise.all(
        ["managed-bookings", "insights", "audit"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
