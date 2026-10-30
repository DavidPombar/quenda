// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import { catalogQuery } from "@/services/catalog.service";
import type { CatalogFilters, CatalogPage } from "@/types/models";
export const catalogRepository = {
  list: (filters: CatalogFilters) =>
    apiClient.request<CatalogPage>(`public/catalog?${catalogQuery(filters)}`),
};
