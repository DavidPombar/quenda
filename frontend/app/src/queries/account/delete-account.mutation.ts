// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accountRepository } from "@/repositories/account.repository";
export function useDeleteAccountMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: accountRepository.remove,
    onSuccess: () => {
      cache.removeQueries({ queryKey: ["bookings"] });
      cache.removeQueries({ queryKey: ["notifications"] });
      cache.removeQueries({ queryKey: ["account"] });
      cache.removeQueries({ queryKey: ["categories"] });
      cache.removeQueries({ queryKey: ["tariff"] });
      cache.setQueryData(["session"], null);
    },
  });
}
