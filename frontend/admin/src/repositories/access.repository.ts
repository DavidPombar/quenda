// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type {
  AccessDay,
  AccessSettings,
  CheckIn,
  CheckInOutcome,
} from "@/types/models";
export const accessRepository = {
  day: () => apiClient.request<AccessDay>("access/day"),
  checkIns: (items: CheckIn[]) =>
    apiClient.request<{
      results: { bookingId: string; outcome: CheckInOutcome }[];
    }>("access/check-ins", { method: "POST", body: JSON.stringify({ items }) }),
  settings: () => apiClient.request<AccessSettings>("manager/access-settings"),
  rotateKey: () =>
    apiClient.request<{ kid: string }>("manager/access-keys/rotation", {
      method: "POST",
    }),
  updateWebhook: (body: { url: string; rotateSecret: boolean }) =>
    apiClient.request<{ url: string; secret: string | null }>(
      "manager/access-webhook",
      { method: "PUT", body: JSON.stringify(body) },
    ),
};
