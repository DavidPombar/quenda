// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrolmentsRepository } from "@/repositories/enrolments.repository";
export function useLeaveEnrolmentMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: enrolmentsRepository.leave,
    onSettled: async () => {
      // A place left goes to the first person waiting.
      await Promise.all(
        ["enrolments", "activities", "activity"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
