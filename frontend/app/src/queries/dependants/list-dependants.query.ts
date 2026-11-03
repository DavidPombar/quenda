// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { dependantsRepository } from "@/repositories/dependants.repository";
export function useListDependantsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["dependants", userId],
    queryFn: dependantsRepository.list,
    enabled: !!userId,
  });
}
