// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authRepository } from "@/repositories/auth.repository";
/** The last step opens a municipal session or, for operators, an operator session. */
export function useCompleteStaffSignInMutation(realm: "tenant" | "operator") {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: authRepository.totp,
    onSuccess: async (session) => {
      if (realm === "operator")
        cache.setQueryData(["operator-session"], session);
      else {
        cache.setQueryData(["session"], session);
        await cache.invalidateQueries({ queryKey: ["insights"] });
      }
    },
  });
}
