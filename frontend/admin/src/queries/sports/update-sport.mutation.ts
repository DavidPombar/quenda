// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sportsRepository } from "@/repositories/sports.repository";
export function useUpdateSportMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: sportsRepository.update,
    // Renaming changes the labels of facilities and clubs too.
    onSuccess: () =>
      Promise.all(
        ["sports", "facilities", "organizations"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  });
}
