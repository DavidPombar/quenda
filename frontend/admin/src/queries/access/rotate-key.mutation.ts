// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accessRepository } from "@/repositories/access.repository";
export function useRotateKeyMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: accessRepository.rotateKey,
    onSuccess: async () => {
      await Promise.all(
        ["access-settings", "access-keys", "audit"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
