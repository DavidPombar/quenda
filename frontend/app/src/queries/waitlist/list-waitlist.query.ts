// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { waitlistRepository } from "@/repositories/waitlist.repository";
export function useListWaitlistQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["waitlist", userId],
    queryFn: waitlistRepository.list,
    enabled: !!userId,
  });
}
