// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { ManagedSport, SportDraft } from "@/types/models";
export const sportsRepository = {
  list: () => apiClient.request<ManagedSport[]>("manager/sports"),
  save: (sports: SportDraft[]) =>
    apiClient.request<ManagedSport[]>("manager/sports", {
      method: "PUT",
      body: JSON.stringify({ sports }),
    }),
};
