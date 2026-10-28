// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { operatorSessionsRepository } from "@/repositories/operator-sessions.repository";
export function useGetOperatorSessionQuery() {
  return useQuery({
    queryKey: ["operator-session"],
    queryFn: operatorSessionsRepository.get,
  });
}
