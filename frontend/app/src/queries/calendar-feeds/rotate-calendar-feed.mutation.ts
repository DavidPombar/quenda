// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { calendarFeedsRepository } from "@/repositories/calendar-feeds.repository";
export function useRotateCalendarFeedMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: calendarFeedsRepository.rotate,
    onSettled: () => cache.invalidateQueries({ queryKey: ["calendar-feed"] }),
  });
}
