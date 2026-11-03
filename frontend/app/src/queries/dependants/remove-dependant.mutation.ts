// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dependantsRepository } from "@/repositories/dependants.repository";
export function useRemoveDependantMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: dependantsRepository.remove,
    onSettled: () => cache.invalidateQueries({ queryKey: ["dependants"] }),
  });
}
