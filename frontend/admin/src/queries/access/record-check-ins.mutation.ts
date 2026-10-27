// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accessRepository } from "@/repositories/access.repository";
export function useRecordCheckInsMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: accessRepository.checkIns,
    networkMode: "always",
    onSuccess: async () => {
      await Promise.all(
        ["access-day", "managed-bookings", "audit"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
