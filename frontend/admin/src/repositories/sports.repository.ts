// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { SportInfo } from "@/types/models";
export type SportDraft = Pick<SportInfo, "code" | "name" | "hidden"> &
  Partial<Pick<SportInfo, "cnidClass" | "cnidType" | "position">>;
export const sportsRepository = {
  list: () => apiClient.request<SportInfo[]>("manager/sports"),
  create: (sport: SportDraft) =>
    apiClient.request<SportInfo>("manager/sports", {
      method: "POST",
      body: JSON.stringify(sport),
    }),
  update: ({
    code,
    ...changes
  }: Pick<SportInfo, "code"> & Partial<SportInfo>) =>
    apiClient.request<SportInfo>(`manager/sports/${encodeURIComponent(code)}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: changes.name,
        hidden: changes.hidden,
        position: changes.position,
      }),
    }),
};
