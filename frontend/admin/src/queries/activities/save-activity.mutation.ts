// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/client/api-client";
import { activitiesRepository } from "@/repositories/activities.repository";
import type { ActivityClash } from "@/types/models";
/** The sessions that cannot be held, from a 409 activity_conflict problem; none otherwise. */
export function activityClashes(error: unknown): ActivityClash[] {
  return error instanceof ApiError && error.code === "activity_conflict"
    ? ((error.problem.clashes as ActivityClash[] | undefined) ?? [])
    : [];
}
/** Sessions hold courts, so availability, bookings and indicators change with them. */
export function useSaveActivityMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: activitiesRepository.save,
    onSuccess: () =>
      Promise.all(
        ["activities", "availability", "managed-bookings", "insights", "audit"].map(
          (key) => cache.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  });
}
