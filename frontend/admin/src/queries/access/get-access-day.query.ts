// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { accessRepository } from "@/repositories/access.repository";
import { storeDay, storedDay } from "@/services/access-store.service";
// Without a network the last synced day is used; the view says how old it is.
export function useGetAccessDayQuery(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: ["access-day", slug],
    queryFn: async () => {
      try {
        const day = await accessRepository.day();
        storeDay(slug, day);
        return { day, offline: false };
      } catch (error) {
        const day = storedDay(slug);
        if (day) return { day, offline: true };
        throw error;
      }
    },
    enabled,
    networkMode: "always",
    retry: false,
    refetchInterval: 5 * 60 * 1000,
  });
}
