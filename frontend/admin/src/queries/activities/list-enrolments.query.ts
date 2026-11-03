// SPDX-License-Identifier: AGPL-3.0-or-later
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { activitiesRepository } from "@/repositories/activities.repository";
/** One page of the people enrolled in an activity or waiting for a place. */
export function useListEnrolmentsQuery(args: {
  id: string;
  status: "enrolled" | "waiting" | null;
  page: number;
}) {
  return useQuery({
    queryKey: ["activity-enrolments", args.id, args.status, args.page],
    queryFn: () => activitiesRepository.enrolments(args),
    placeholderData: keepPreviousData,
  });
}
