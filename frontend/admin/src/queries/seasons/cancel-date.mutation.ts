// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { seasonsRepository } from "@/repositories/seasons.repository";
export function useCancelDateMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: seasonsRepository.cancelDate,
    onSuccess: () =>
      Promise.all(
        [
          "season-allocations",
          "availability",
          "managed-bookings",
          "insights",
          "audit",
        ].map((key) => cache.invalidateQueries({ queryKey: [key] })),
      ),
  });
}
