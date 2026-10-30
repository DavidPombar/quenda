// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authRepository } from "@/repositories/auth.repository";
export function useVerifyEmailCodeMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: authRepository.verifyEmailCode,
    onSuccess: (session) => {
      cache.removeQueries({ queryKey: ["bookings"] });
      cache.removeQueries({ queryKey: ["notifications"] });
      // Passes and penalties are personal and also kept for offline use (#24).
      cache.removeQueries({ queryKey: ["access-pass"] });
      cache.removeQueries({ queryKey: ["penalty"] });
      cache.setQueryData(["session"], session);
    },
  });
}
