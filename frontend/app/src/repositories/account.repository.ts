// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { Account, AccountExport, Locale } from "@/types/models";
export const accountRepository = {
  get: () => apiClient.request<Account>("citizen/me"),
  exportData: () => apiClient.request<AccountExport>("citizen/me/export"),
  remove: () => apiClient.request<void>("citizen/me", { method: "DELETE" }),
  updateLocale: (locale: Locale) =>
    apiClient.request<void>("citizen/me", {
      method: "PATCH",
      body: JSON.stringify({ locale }),
    }),
  updatePreferences: (preferences: { reminderEmails: boolean }) =>
    apiClient.request<void>("citizen/me/notification-preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    }),
  unsubscribe: (token: string) =>
    apiClient.request<void>("public/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
};
