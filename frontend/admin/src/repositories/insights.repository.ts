// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { DateRange, Insights } from "@/types/models";
export const insightsRepository = {
  /** Without a range the API returns the coming week. */
  get: (range?: DateRange) =>
    apiClient.request<Insights>(
      range
        ? `manager/insights?${new URLSearchParams({ ...range }).toString()}`
        : "manager/insights",
    ),
};
