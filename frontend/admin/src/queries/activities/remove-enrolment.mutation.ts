// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activitiesRepository } from "@/repositories/activities.repository";
/** A removed place goes to the first person waiting, so the counts change too. */
export function useRemoveEnrolmentMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: activitiesRepository.removeEnrolment,
    onSuccess: () =>
      Promise.all(
        ["activity-enrolments", "activities", "audit"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  });
}
