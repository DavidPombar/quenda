// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accessRepository } from "@/repositories/access.repository";
export function useCheckInMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: accessRepository.checkIn,
    // Scans made offline are queued by the controller; never pause them here.
    networkMode: "always",
    onSuccess: async () => {
      await Promise.all(
        ["managed-bookings", "audit"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
