// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { MunicipalityExport } from "@/types/models";
export const portabilityRepository = {
  exportMunicipality: () =>
    apiClient.request<MunicipalityExport>("manager/export"),
};
