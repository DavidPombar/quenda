// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsRepository } from "@/repositories/bookings.repository";
export function useUpdateBookingMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: bookingsRepository.update,
    onSettled: async () => {
      await Promise.all(
        [
          "bookings",
          "notifications",
          "penalty",
          "availability",
          "insights",
        ].map((key) => cache.invalidateQueries({ queryKey: [key] })),
      );
    },
  });
}
