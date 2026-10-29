// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { seasonsRepository } from "@/repositories/seasons.repository";
export function useAddRepresentativeMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: seasonsRepository.addRepresentative,
    onSuccess: () =>
      Promise.all(
        ["season-organizations", "audit"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  });
}
