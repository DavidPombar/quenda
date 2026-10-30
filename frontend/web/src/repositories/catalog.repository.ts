// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import { catalogQuery } from "@/services/catalog.service";
import type {
  CatalogEntry,
  CatalogFilters,
  MunicipalitySummary,
  SportOption,
} from "@/types/models";
export const catalogRepository = {
  list: (filters: CatalogFilters) =>
    apiClient.request<CatalogEntry[]>(
      `public/catalog?${catalogQuery(filters)}`,
    ),
  /** Sports offered by some facility of these municipalities (all when empty). */
  sports: (municipalities: string[]) =>
    apiClient.request<SportOption[]>(
      `public/sports${municipalities.length ? `?municipality=${municipalities.map(encodeURIComponent).join(",")}` : ""}`,
    ),
  municipalities: () =>
    apiClient.request<MunicipalitySummary[]>("public/municipalities"),
};
