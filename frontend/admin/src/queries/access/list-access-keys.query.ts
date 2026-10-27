// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { accessRepository } from "@/repositories/access.repository";
import { cachedKeys, rememberKeys } from "@/services/access-store.service";
/** Public keys for offline validation; the last copy stays on the phone for dead zones. */
export function useListAccessKeysQuery(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["access-keys", tenantId],
    queryFn: async () =>
      rememberKeys(tenantId ?? "", await accessRepository.keys()),
    enabled: !!tenantId,
    initialData: () => cachedKeys(tenantId ?? "") ?? undefined,
    initialDataUpdatedAt: 0,
    networkMode: "always",
  });
}
