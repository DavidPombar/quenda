// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sportsRepository } from "@/repositories/sports.repository";
export function useSaveSportsMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: sportsRepository.save,
    onSuccess: async () => {
      await Promise.all(
        ["sports", "facilities"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
