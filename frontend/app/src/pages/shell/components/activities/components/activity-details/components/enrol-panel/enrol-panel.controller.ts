// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { useListEnrolmentsQuery } from "@/queries/enrolments/list-enrolments.query";
import { useEnrolMutation } from "@/queries/enrolments/enrol.mutation";
import { useLeaveEnrolmentMutation } from "@/queries/enrolments/leave-enrolment.mutation";
import { useListDependantsQuery } from "@/queries/dependants/list-dependants.query";
import type { AppContext } from "@/types/app-context";
import type { PublicActivityDetails } from "@/types/models";
/** Adults enrol themselves when an activity's top age reaches adulthood, or it has none. */
const ADULT_AGE = 18;
/** Who an enrolment is for: the adult ("me") or a person in their care. */
export interface Participant {
  key: string;
  dependantId: string | null;
  name: string | null;
  age: number | null;
  allowed: boolean;
}
const fits = (age: number, a: PublicActivityDetails) =>
  (a.minAge === null || age >= a.minAge) &&
  (a.maxAge === null || age <= a.maxAge);
export function useEnrolPanelController(p: {
  activity: PublicActivityDetails;
  context: AppContext;
}) {
  const userId = p.context.session?.userId;
  const enrolments = useListEnrolmentsQuery(userId);
  const dependants = useListDependantsQuery(userId);
  const enrol = useEnrolMutation();
  const leave = useLeaveEnrolmentMutation();
  const [confirming, setConfirming] = useState(false);
  // One id per attempt, so a retried request does not enrol twice.
  const [attempt, setAttempt] = useState(() => crypto.randomUUID());
  const a = p.activity;
  // Open enrolments of the adult and of the people in their care in this activity.
  const mine = (enrolments.data ?? []).filter(
    (entry) =>
      entry.activityId === a.id &&
      (entry.status === "enrolled" || entry.status === "waiting"),
  );
  const taken = new Set(
    mine.map((entry) => entry.participant?.dependantId ?? "me"),
  );
  // Ages count in the year the activity starts, as its limits mean.
  const year = Temporal.PlainDate.from(a.rule.startsOn).year;
  const participants: Participant[] = [
    ...(a.maxAge === null || a.maxAge >= ADULT_AGE
      ? [
          {
            key: "me",
            dependantId: null,
            name: null,
            age: null,
            allowed: true,
          },
        ]
      : []),
    ...(dependants.data ?? []).map((person) => {
      const age = year - person.birthYear;
      return {
        key: person.id,
        dependantId: person.id,
        name: person.firstName,
        age,
        allowed: fits(age, a),
      };
    }),
  ].filter((participant) => !taken.has(participant.key));
  const [chosen, setChosen] = useState<string | null>(null);
  const selected =
    participants.find(
      (participant) => participant.key === chosen && participant.allowed,
    ) ?? participants.find((participant) => participant.allowed);
  return {
    enrolments,
    enrol,
    leave,
    mine,
    participants,
    selected,
    choose: setChosen,
    childrenOnly: a.maxAge !== null && a.maxAge < ADULT_AGE,
    canEnrol:
      a.status === "published" &&
      (a.enrolment === "open" || a.enrolment === "full"),
    confirming,
    open: () => {
      enrol.reset();
      setAttempt(crypto.randomUUID());
      setConfirming(true);
    },
    close: () => {
      if (!enrol.isPending) setConfirming(false);
    },
    confirm: () =>
      selected &&
      enrol.mutate({
        id: attempt,
        activityId: a.id,
        dependantId: selected.dependantId,
      }),
  };
}
