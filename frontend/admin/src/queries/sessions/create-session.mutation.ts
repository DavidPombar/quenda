// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsRepository } from "@/repositories/sessions.repository";
export function useCreateSessionMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: sessionsRepository.create,
    onSuccess: async (session) => {
      cache.setQueryData(["session"], session);
      await cache.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}
