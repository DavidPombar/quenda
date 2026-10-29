// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { MyClub, SeasonCampaign } from "@/types/models";
export const seasonsRepository = {
  myClub: () => apiClient.request<MyClub>("citizen/me/club"),
  campaigns: (slug: string) =>
    apiClient.request<SeasonCampaign[]>(
      `public/season-campaigns?slug=${encodeURIComponent(slug)}`,
    ),
};
