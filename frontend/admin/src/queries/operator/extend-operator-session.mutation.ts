// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { operatorSessionsRepository } from "@/repositories/operator-sessions.repository";
/** Keeps the operator session open for another eight hours (WCAG 2.2.1). */
export function useExtendOperatorSessionMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: operatorSessionsRepository.extend,
    onSuccess: () =>
      cache.invalidateQueries({ queryKey: ["operator-session"] }),
  });
}
