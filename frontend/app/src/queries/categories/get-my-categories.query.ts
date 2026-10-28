// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { categoriesRepository } from "@/repositories/categories.repository";
export function useGetMyCategoriesQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["categories", userId],
    queryFn: categoriesRepository.mine,
    enabled: !!userId,
  });
}
