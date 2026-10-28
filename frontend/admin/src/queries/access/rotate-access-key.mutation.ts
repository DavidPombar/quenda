// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accessRepository } from "@/repositories/access.repository";
export function useRotateAccessKeyMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: accessRepository.rotateKey,
    onSuccess: () =>
      Promise.all(
        ["access-settings", "access-day", "audit"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  });
}
