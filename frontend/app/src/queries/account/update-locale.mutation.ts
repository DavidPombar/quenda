// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accountRepository } from "@/repositories/account.repository";
export function useUpdateLocaleMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: accountRepository.updateLocale,
    onSuccess: () => cache.invalidateQueries({ queryKey: ["account"] }),
  });
}
