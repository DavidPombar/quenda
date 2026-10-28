// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { CalendarFeed, CalendarFeedLink } from "@/types/models";
export const calendarFeedsRepository = {
  get: () => apiClient.request<CalendarFeed>("citizen/calendar-feed"),
  rotate: () =>
    apiClient.request<CalendarFeedLink>("citizen/calendar-feed", {
      method: "POST",
    }),
  revoke: () =>
    apiClient.request<void>("citizen/calendar-feed", { method: "DELETE" }),
  /** Same-origin download; the session cookie authenticates the GET. */
  bookingHref: (bookingId: string) =>
    `/v2/citizen/bookings/${bookingId}/calendar.ics`,
};
