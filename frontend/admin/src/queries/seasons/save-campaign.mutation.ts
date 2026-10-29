// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { seasonsRepository } from "@/repositories/seasons.repository";
export function useSaveCampaignMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: seasonsRepository.saveCampaign,
    onSuccess: () =>
      Promise.all(
        ["season-campaigns", "audit"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  });
}
