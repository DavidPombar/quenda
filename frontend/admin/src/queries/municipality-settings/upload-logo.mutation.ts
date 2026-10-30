// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { municipalitySettingsRepository } from "@/repositories/municipality-settings.repository";
import { appIconRepository } from "@/repositories/app-icon.repository";
export function useUploadLogoMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      await municipalitySettingsRepository.uploadLogo(file);
      // The installed app's icon is drawn from the new logo (#24). If that fails, the app
      // keeps Quenda's icon and the logo upload still counts.
      try {
        await municipalitySettingsRepository.uploadIcon(
          await appIconRepository.draw(file),
        );
      } catch {
        /* Quenda's icon stays. */
      }
    },
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
