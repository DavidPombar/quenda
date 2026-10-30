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
      cache.setQueryData(["session"], session);
    },
  });
}
