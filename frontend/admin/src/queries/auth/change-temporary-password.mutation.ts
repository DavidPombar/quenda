// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation } from "@tanstack/react-query";
import { authRepository } from "@/repositories/auth.repository";
export function useChangeTemporaryPasswordMutation() {
  return useMutation({ mutationFn: authRepository.changePassword });
}
