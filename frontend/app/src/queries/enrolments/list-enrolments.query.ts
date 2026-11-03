// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { enrolmentsRepository } from "@/repositories/enrolments.repository";
export function useListEnrolmentsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["enrolments", userId],
    queryFn: enrolmentsRepository.list,
    enabled: !!userId,
  });
}
