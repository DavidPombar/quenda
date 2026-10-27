// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type {
  AccessPass,
  Booking,
  Notification,
  PenaltyStanding,
} from "@/types/models";
export const bookingsRepository = {
  list: () => apiClient.request<Booking[]>("citizen/bookings"),
  penalty: () => apiClient.request<PenaltyStanding>("citizen/penalty"),
  notifications: () =>
    apiClient.request<Notification[]>("citizen/notifications"),
  accessPass: (id: string) =>
    apiClient.request<AccessPass>(`citizen/bookings/${id}/access-pass`, {
      method: "POST",
    }),
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
