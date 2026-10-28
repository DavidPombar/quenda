// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { operatorSessionsRepository } from "@/repositories/operator-sessions.repository";
export function useCreateOperatorSessionMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: operatorSessionsRepository.create,
    onSuccess: (session) => {
      cache.setQueryData(["operator-session"], session);
    },
  });
}
