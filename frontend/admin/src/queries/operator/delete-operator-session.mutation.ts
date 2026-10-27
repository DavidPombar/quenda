// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { operatorSessionsRepository } from "@/repositories/operator-sessions.repository";
export function useDeleteOperatorSessionMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: operatorSessionsRepository.remove,
    onSuccess: () => {
      cache.setQueryData(["operator-session"], null);
      cache.removeQueries({ queryKey: ["operator"] });
    },
  });
}
