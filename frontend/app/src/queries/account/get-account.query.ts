// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { accountRepository } from "@/repositories/account.repository";
export function useGetAccountQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["account", userId],
    queryFn: accountRepository.get,
    enabled: !!userId,
  });
}
