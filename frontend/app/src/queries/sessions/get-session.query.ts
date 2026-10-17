// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { sessionsRepository } from "@/repositories/sessions.repository";
export function useGetSessionQuery() {
  return useQuery({ queryKey: ["session"], queryFn: sessionsRepository.get });
}
