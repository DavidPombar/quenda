// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrolmentsRepository } from "@/repositories/enrolments.repository";
export function useEnrolMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: enrolmentsRepository.enrol,
    onSettled: async () => {
      // Free places, the person's enrolments and their notices all change.
      await Promise.all(
        ["enrolments", "activities", "activity", "notifications"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
