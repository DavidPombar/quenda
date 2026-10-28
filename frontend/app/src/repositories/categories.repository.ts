// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type {
  Category,
  MyCategories,
  Tariff,
  UserCategory,
} from "@/types/models";
export const categoriesRepository = {
  mine: () => apiClient.request<MyCategories>("citizen/categories"),
  request: (category: Category) =>
    apiClient.request<UserCategory>("citizen/categories", {
      method: "POST",
      body: JSON.stringify({ category }),
    }),
  setFamilyPreference: (prefersFamilyTariff: boolean) =>
    apiClient.request<void>("citizen/category-preference", {
      method: "PUT",
      body: JSON.stringify({ prefersFamilyTariff }),
    }),
  tariff: (facilityId: string) =>
    apiClient.request<Tariff>(`citizen/tariffs/${facilityId}`),
};
