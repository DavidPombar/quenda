// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { BookingChange, ManagedBooking } from "@/types/models";
export const bookingsRepository = {
  listDay: (args: { date: string; facilityId?: string }) => {
    const params = new URLSearchParams({ date: args.date });
    if (args.facilityId) params.set("facilityId", args.facilityId);
    return apiClient.request<ManagedBooking[]>(`manager/bookings?${params}`);
  },
  manage: (args: { id: string; change: BookingChange }) =>
    apiClient.request<void>(`manager/bookings/${args.id}`, {
      method: "PATCH",
      body: JSON.stringify(args.change),
    }),
  markUncheckedNoShows: (args: { facilityId?: string }) =>
    apiClient.request<{ marked: number }>("manager/bookings/no-shows", {
      method: "POST",
      body: JSON.stringify(args),
    }),
};
