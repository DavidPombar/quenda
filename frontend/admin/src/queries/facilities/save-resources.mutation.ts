// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { facilitiesRepository } from "@/repositories/facilities.repository";
export function useSaveResourcesMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: facilitiesRepository.saveResources,
    onSuccess: async () => {
      await Promise.all(
        ["facilities", "availability", "insights"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
