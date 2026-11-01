// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsRepository } from "@/repositories/sessions.repository";
/** Keeps the session open for another eight hours (WCAG 2.2.1). */
export function useExtendSessionMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: sessionsRepository.extend,
    onSuccess: () => cache.invalidateQueries({ queryKey: ["session"] }),
  });
}
