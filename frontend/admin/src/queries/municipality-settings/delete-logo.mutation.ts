// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { municipalitySettingsRepository } from "@/repositories/municipality-settings.repository";
export function useDeleteLogoMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: municipalitySettingsRepository.deleteLogo,
    onSuccess: async () => {
      // The shell reads branding, language and legal texts from the public list.
      await Promise.all(
        ["municipality-settings", "municipalities", "availability"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
