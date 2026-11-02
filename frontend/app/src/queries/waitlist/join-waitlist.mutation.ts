// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { waitlistRepository } from "@/repositories/waitlist.repository";
export function useJoinWaitlistMutation() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: waitlistRepository.join,
    onSettled: async () => {
      await cache.invalidateQueries({ queryKey: ["waitlist"] });
    },
  });
}
