// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { facilitiesRepository } from "@/repositories/facilities.repository";
export function useSuggestSlotsQuery(args: {
  slug: string;
  facilityId: string;
  date: string;
  around: string | null;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: [
      "slot-suggestions",
      args.slug,
      args.facilityId,
      args.date,
      args.around,
    ],
    queryFn: async () =>
      (await facilitiesRepository.suggestions(args)).suggestions,
    enabled: args.enabled && !!args.facilityId,
  });
}
