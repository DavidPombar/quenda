// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { useGetActivityQuery } from "@/queries/activities/get-activity.query";
import { useCancelActivityMutation } from "@/queries/activities/cancel-activity.mutation";
import { useCancelActivitySessionMutation } from "@/queries/activities/cancel-activity-session.mutation";
import type { ActivitySession, ManagedActivity } from "@/types/models";
const SHOWN = 12;
/** Upcoming sessions of a published activity, and cancelling one or all of them (#97). */
export function useActivitySessionsController(p: { activity: ManagedActivity }) {
  const details = useGetActivityQuery(p.activity.id);
  const cancelActivity = useCancelActivityMutation();
  const cancelSession = useCancelActivitySessionMutation();
  const [all, setAll] = useState(false);
  const [dialog, setDialog] = useState<
    { kind: "activity" } | { kind: "session"; session: ActivitySession } | null
  >(null);
  const now = Temporal.Now.instant();
  const upcoming = (details.data?.sessions ?? []).filter(
    (session) => Temporal.Instant.compare(Temporal.Instant.from(session.end), now) > 0,
  );
  async function confirm(reason: string) {
    if (!dialog) return;
    try {
      if (dialog.kind === "activity")
        await cancelActivity.mutateAsync({ id: p.activity.id, reason });
      else
        await cancelSession.mutateAsync({ id: dialog.session.id, reason });
      setDialog(null);
    } catch {
      /* The dialog shows the error. */
    }
  }
  return {
    details,
    sessions: all ? upcoming : upcoming.slice(0, SHOWN),
    hidden: all ? 0 : Math.max(upcoming.length - SHOWN, 0),
    showAll: () => setAll(true),
    started: (session: ActivitySession) =>
      Temporal.Instant.compare(Temporal.Instant.from(session.start), now) <= 0,
    dialog,
    openActivity: () => {
      cancelActivity.reset();
      setDialog({ kind: "activity" });
    },
    openSession: (session: ActivitySession) => {
      cancelSession.reset();
      setDialog({ kind: "session", session });
    },
    close: () => setDialog(null),
    confirm,
    pending: cancelActivity.isPending || cancelSession.isPending,
    failed: cancelActivity.isError || cancelSession.isError,
  };
}
