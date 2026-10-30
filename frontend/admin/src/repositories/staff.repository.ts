// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { StaffAccount, TemporaryPassword } from "@/types/models";
export const staffRepository = {
  list: () => apiClient.request<StaffAccount[]>("manager/staff"),
  createDoorStaff: (body: { id: string; displayName: string; login: string }) =>
    apiClient.request<TemporaryPassword>("manager/staff", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (args: { userId: string; action: "reset" | "disable" | "enable" }) =>
    apiClient.request<TemporaryPassword>(`manager/staff/${args.userId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: args.action }),
    }),
};
