// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesRepository } from "@/repositories/categories.repository";
export function useRequestCategoryMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: categoriesRepository.request,
    onSettled: () => cache.invalidateQueries({ queryKey: ["categories"] }),
  });
}
