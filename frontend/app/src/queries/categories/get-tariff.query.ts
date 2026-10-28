// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { categoriesRepository } from "@/repositories/categories.repository";
/** The price this person would pay at the facility; only meaningful when signed in. */
export function useGetTariffQuery(args: {
  facilityId: string;
  userId: string | undefined;
}) {
  return useQuery({
    queryKey: ["tariff", args.facilityId, args.userId],
    queryFn: () => categoriesRepository.tariff(args.facilityId),
    enabled: !!args.userId && !!args.facilityId,
  });
}
