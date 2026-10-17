// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { Booking, Notification } from "@/types/models";
export const bookingsRepository = {
  list: () => apiClient.request<Booking[]>("citizen/bookings"),
  notifications: () =>
    apiClient.request<Notification[]>("citizen/notifications"),
  create: (body: { id: string; facilityId: string; start: string }) =>
    apiClient.request<Booking>("citizen/bookings", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (args: { id: string; start?: string; status?: "cancelled" }) =>
    apiClient.request<void>(`citizen/bookings/${args.id}`, {
      method: "PATCH",
      body: JSON.stringify({ start: args.start, status: args.status }),
    }),
};
