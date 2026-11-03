// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useListEnrolmentsQuery } from "@/queries/enrolments/list-enrolments.query";
import { useEnrolMutation } from "@/queries/enrolments/enrol.mutation";
import { useLeaveEnrolmentMutation } from "@/queries/enrolments/leave-enrolment.mutation";
import type { AppContext } from "@/types/app-context";
import type { PublicActivityDetails } from "@/types/models";
/** Adults enrol themselves; activities for younger people are handled by the council for now. */
const ADULT_AGE = 18;
export function useEnrolPanelController(p: {
  activity: PublicActivityDetails;
  context: AppContext;
}) {
  const enrolments = useListEnrolmentsQuery(p.context.session?.userId);
  const enrol = useEnrolMutation();
  const leave = useLeaveEnrolmentMutation();
  const [confirming, setConfirming] = useState(false);
  // One id per attempt, so a retried request does not enrol twice.
  const [attempt, setAttempt] = useState(() => crypto.randomUUID());
  const mine = enrolments.data?.find(
    (entry) =>
      entry.activityId === p.activity.id &&
      (entry.status === "enrolled" || entry.status === "waiting"),
  );
  return {
    enrolments,
    enrol,
    leave,
    mine,
    forMinors: p.activity.maxAge !== null && p.activity.maxAge < ADULT_AGE,
    canEnrol:
      p.activity.status === "published" &&
      (p.activity.enrolment === "open" || p.activity.enrolment === "full"),
    confirming,
    open: () => {
      enrol.reset();
      setAttempt(crypto.randomUUID());
      setConfirming(true);
    },
    close: () => {
      if (!enrol.isPending) setConfirming(false);
    },
    confirm: () => enrol.mutate({ id: attempt, activityId: p.activity.id }),
  };
}
