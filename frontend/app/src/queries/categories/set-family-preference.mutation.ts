// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesRepository } from "@/repositories/categories.repository";
export function useSetFamilyPreferenceMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: categoriesRepository.setFamilyPreference,
    onSettled: async () => {
      await Promise.all(
        ["categories", "tariff"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
