// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { calendarFeedsRepository } from "@/repositories/calendar-feeds.repository";
export function useGetCalendarFeedQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["calendar-feed", userId],
    queryFn: calendarFeedsRepository.get,
    enabled: !!userId,
  });
}
