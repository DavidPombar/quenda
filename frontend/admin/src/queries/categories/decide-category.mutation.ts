// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesRepository } from "@/repositories/categories.repository";
export function useDecideCategoryMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: categoriesRepository.decide,
    onSettled: async () => {
      await Promise.all(
        ["category-requests", "citizens", "audit"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
