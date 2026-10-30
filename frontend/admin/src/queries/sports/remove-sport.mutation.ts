// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sportsRepository } from "@/repositories/sports.repository";
export function useRemoveSportMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: sportsRepository.remove,
    onSuccess: () => cache.invalidateQueries({ queryKey: ["sports"] }),
  });
}
