// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portabilityRepository } from "@/repositories/portability.repository";
/** A mutation, not a query: every export is a fresh, audited snapshot. */
export function useExportMunicipalityMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: portabilityRepository.exportMunicipality,
    onSuccess: () => cache.invalidateQueries({ queryKey: ["audit"] }),
  });
}
