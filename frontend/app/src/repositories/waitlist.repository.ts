// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { WaitlistEntry } from "@/types/models";
export const waitlistRepository = {
  list: () => apiClient.request<WaitlistEntry[]>("citizen/waitlist"),
  join: (body: {
    id: string;
    facilityId: string;
    resourceId?: string;
    start: string;
  }) =>
    apiClient.request<WaitlistEntry>("citizen/waitlist", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  leave: (id: string) =>
    apiClient.request<void>(`citizen/waitlist/${id}`, { method: "DELETE" }),
};
