// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { Insights } from "@/types/models";
export const insightsRepository = {
  get: () => apiClient.request<Insights>("manager/insights"),
};
