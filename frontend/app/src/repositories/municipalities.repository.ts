// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { Municipality } from "@/types/models";
export const municipalitiesRepository = {
  list: () => apiClient.request<Municipality[]>("public/municipalities"),
};
