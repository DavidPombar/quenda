// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation } from "@tanstack/react-query";
import { portabilityRepository } from "@/repositories/portability.repository";
/** A mutation, not a query: every export is a fresh, audited snapshot. */
export function useExportMunicipalityMutation() {
  return useMutation({ mutationFn: portabilityRepository.exportMunicipality });
}
