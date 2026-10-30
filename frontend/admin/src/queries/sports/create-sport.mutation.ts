// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sportsRepository } from "@/repositories/sports.repository";
export function useCreateSportMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: sportsRepository.create,
    onSuccess: () => cache.invalidateQueries({ queryKey: ["sports"] }),
  });
}
