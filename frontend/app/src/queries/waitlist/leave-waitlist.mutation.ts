// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { waitlistRepository } from "@/repositories/waitlist.repository";
export function useLeaveWaitlistMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: waitlistRepository.leave,
    onSettled: async () => {
      // Leaving with an open offer frees the place for the next person.
      await Promise.all(
        ["waitlist", "availability"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
