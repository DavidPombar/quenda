// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type {
  AccessKeys,
  AccessSettings,
  CheckIn,
  SigningKey,
} from "@/types/models";
export const accessRepository = {
  keys: () => apiClient.request<AccessKeys>("access/keys"),
  checkIn: (body: { token: string; scannedAt?: string }) =>
    apiClient.request<CheckIn>("access/check-ins", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  settings: () => apiClient.request<AccessSettings>("manager/access"),
  rotateKey: () =>
    apiClient.request<SigningKey>("manager/access/key-rotations", {
      method: "POST",
      body: "{}",
    }),
  configureWebhook: (body: { url: string | null; rotateSecret?: boolean }) =>
    apiClient.request<{ url: string | null; secret: string | null }>(
      "manager/access/webhook",
      { method: "PUT", body: JSON.stringify(body) },
    ),
};
