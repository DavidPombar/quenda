// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { municipalitySettingsRepository } from "@/repositories/municipality-settings.repository";
export function useGetMunicipalitySettingsQuery(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["municipality-settings", tenantId],
    queryFn: municipalitySettingsRepository.get,
    enabled: !!tenantId,
  });
}
