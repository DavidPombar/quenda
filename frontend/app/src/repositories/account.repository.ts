// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type {
  Account,
  AccountExport,
  Locale,
  NoticeKind,
  NoticePreferences,
  NotificationSettings,
  PushDevice,
} from "@/types/models";
export const accountRepository = {
  get: () => apiClient.request<Account>("citizen/me"),
  exportData: () => apiClient.request<AccountExport>("citizen/me/export"),
  remove: () => apiClient.request<void>("citizen/me", { method: "DELETE" }),
  updateLocale: (locale: Locale) =>
    apiClient.request<void>("citizen/me", {
      method: "PATCH",
      body: JSON.stringify({ locale }),
    }),
  getNotificationSettings: () =>
    apiClient.request<NotificationSettings>(
      "citizen/me/notification-preferences",
    ),
  updatePreferences: (preferences: NoticePreferences) =>
    apiClient.request<void>("citizen/me/notification-preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    }),
  savePushDevice: (device: PushDevice) =>
    apiClient.request<void>("citizen/me/push-subscriptions", {
      method: "POST",
      body: JSON.stringify(device),
    }),
  removePushDevice: (endpoint: string) =>
    apiClient.request<void>("citizen/me/push-subscriptions", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    }),
  unsubscribe: (token: string) =>
    apiClient.request<{ kind: NoticeKind }>("public/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
};
