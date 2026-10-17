// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { facilitiesRepository } from "@/repositories/facilities.repository";
export function useGetAvailabilityQuery(args: {
  slug: string;
  id: string;
  date: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["availability", args.slug, args.id, args.date],
    queryFn: () => facilitiesRepository.availability(args),
    enabled: args.enabled !== false && !!args.id,
    refetchInterval: 30000,
  });
}
