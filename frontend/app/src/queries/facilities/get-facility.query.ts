// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { facilitiesRepository } from "@/repositories/facilities.repository";
export function useGetFacilityQuery(args: { slug: string; id: string }) {
  return useQuery({
    queryKey: ["facility", args.slug, args.id],
    queryFn: () => facilitiesRepository.get(args),
    enabled: !!args.id,
  });
}
