// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsRepository } from "@/repositories/sessions.repository";
export function useDeleteSessionMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: sessionsRepository.remove,
    onSuccess: () => {
      cache.removeQueries({ queryKey: ["insights"] });
      cache.setQueryData(["session"], null);
    },
  });
}
