// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import { catalogQuery } from "@/services/catalog.service";
import type {
  CatalogEntry,
  CatalogFilters,
  MunicipalitySummary,
} from "@/types/models";
export const catalogRepository = {
  list: (filters: CatalogFilters) =>
    apiClient.request<CatalogEntry[]>(
      `public/catalog?${catalogQuery(filters)}`,
    ),
  municipalities: () =>
    apiClient.request<MunicipalitySummary[]>("public/municipalities"),
};
