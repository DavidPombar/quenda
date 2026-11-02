// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activitiesRepository } from "@/repositories/activities.repository";
/** Sessions hold courts, so availability, bookings and indicators change with them. */
export function usePublishActivityMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: activitiesRepository.publish,
    onSuccess: () =>
      Promise.all(
        ["activities", "availability", "managed-bookings", "insights", "audit"].map(
          (key) => cache.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  });
}
