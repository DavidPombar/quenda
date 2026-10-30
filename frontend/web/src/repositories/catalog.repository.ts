// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import { catalogQuery } from "@/services/catalog.service";
import type {
  CatalogFilters,
  CatalogPage,
  MunicipalitySummary,
  SportInfo,
} from "@/types/models";
export const catalogRepository = {
  list: (filters: CatalogFilters) =>
    apiClient.request<CatalogPage>(`public/catalog?${catalogQuery(filters)}`),
  /** Visible sports of the chosen municipalities, or of all of them. */
  sports: (municipalities: readonly string[]) =>
    apiClient.request<SportInfo[]>(
      `public/sports${municipalities.length ? `?${new URLSearchParams({ municipality: municipalities.join(",") })}` : ""}`,
    ),
  municipalities: () =>
    apiClient.request<MunicipalitySummary[]>("public/municipalities"),
};
