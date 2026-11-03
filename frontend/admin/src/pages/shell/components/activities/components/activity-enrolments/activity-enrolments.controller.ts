// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useListEnrolmentsQuery } from "@/queries/activities/list-enrolments.query";
import { useRemoveEnrolmentMutation } from "@/queries/activities/remove-enrolment.mutation";
import type { ManagedActivity, ManagedEnrolment } from "@/types/models";
/** The people of an activity, page by page, and removing one with a reason (#97). */
export function useActivityEnrolmentsController(p: {
  activity: ManagedActivity;
}) {
  const [status, setStatus] = useState<"enrolled" | "waiting" | null>(null);
  const [page, setPage] = useState(1);
  const enrolments = useListEnrolmentsQuery({
    id: p.activity.id,
    status,
    page,
  });
  const remove = useRemoveEnrolmentMutation();
  const [removing, setRemoving] = useState<ManagedEnrolment | null>(null);
  const data = enrolments.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  return {
    enrolments,
    status,
    setStatus: (value: "enrolled" | "waiting" | null) => {
      setStatus(value);
      setPage(1);
    },
    page,
    pages,
    previous: () => setPage((value) => Math.max(1, value - 1)),
    next: () => setPage((value) => Math.min(pages, value + 1)),
    removing,
    open: (enrolment: ManagedEnrolment) => {
      remove.reset();
      setRemoving(enrolment);
    },
    close: () => setRemoving(null),
    remove,
    confirm: async (reason: string) => {
      if (!removing) return;
      try {
        await remove.mutateAsync({ id: removing.id, reason });
        setRemoving(null);
      } catch {
        /* The dialog shows the error. */
      }
    },
  };
}
