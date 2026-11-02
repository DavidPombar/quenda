// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useJoinWaitlistMutation } from "@/queries/waitlist/join-waitlist.mutation";
import { timeLabel } from "@/services/date.service";
import { fill } from "@/services/i18n.service";
import type { AppContext } from "@/types/app-context";
import type { Slot, WaitlistEntry } from "@/types/models";
/** Joins the waiting list of a full slot (#96), signing in first when needed. */
export function useWaitlistDialogController(p: {
  context: AppContext;
  facilityId: string;
  /** Sent only when the facility has several courts. */
  resourceId: string | null;
  slot: Slot;
  /** The person's open entry for this slot, once they are on the list. */
  entry: WaitlistEntry | null;
}) {
  const { t, municipality } = p.context;
  const join = useJoinWaitlistMutation();
  const [requestId] = useState(() => crypto.randomUUID());
  const status = p.entry
    ? p.entry.status === "offered"
      ? fill(t("waitlistOfferedHere"), {
          time: timeLabel(p.entry.offerExpiresAt ?? "", municipality.timezone),
        })
      : fill(t("waitlistJoined"), { position: p.entry.position })
    : "";
  return {
    join,
    status,
    body: fill(t("waitlistBody"), {
      minutes: municipality.waitlistOfferMinutes,
    }),
    submit: () => {
      if (!p.context.session) {
        p.context.signIn();
        return;
      }
      join.mutate({
        id: requestId,
        facilityId: p.facilityId,
        start: p.slot.start,
        ...(p.resourceId ? { resourceId: p.resourceId } : {}),
      });
    },
  };
}
