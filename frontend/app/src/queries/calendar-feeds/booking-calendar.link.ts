// SPDX-License-Identifier: AGPL-3.0-or-later
import { calendarFeedsRepository } from "@/repositories/calendar-feeds.repository";
/** Download links are plain GETs, not cached server state. */
export function useBookingCalendarLink() {
  return calendarFeedsRepository.bookingHref;
}
