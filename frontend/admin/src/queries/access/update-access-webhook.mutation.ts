// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accessRepository } from "@/repositories/access.repository";
export function useUpdateAccessWebhookMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: accessRepository.updateWebhook,
    onSuccess: () =>
      Promise.all(
        ["access-settings", "audit"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  });
}
