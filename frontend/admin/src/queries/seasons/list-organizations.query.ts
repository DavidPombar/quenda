// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { seasonsRepository } from "@/repositories/seasons.repository";
export function useListOrganizationsQuery(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["season-organizations", tenantId],
    queryFn: seasonsRepository.organizations,
    enabled: !!tenantId,
  });
}
