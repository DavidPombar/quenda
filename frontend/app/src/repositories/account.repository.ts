// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { Account, AccountExport } from "@/types/models";
export const accountRepository = {
  get: () => apiClient.request<Account>("citizen/me"),
  exportData: () => apiClient.request<AccountExport>("citizen/me/export"),
  remove: () => apiClient.request<void>("citizen/me", { method: "DELETE" }),
};
