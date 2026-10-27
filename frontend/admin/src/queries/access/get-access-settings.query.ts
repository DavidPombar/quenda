// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { accessRepository } from "@/repositories/access.repository";
export function useGetAccessSettingsQuery(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["access-settings", tenantId],
    queryFn: accessRepository.settings,
    enabled: !!tenantId,
  });
}
