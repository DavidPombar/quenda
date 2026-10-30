// SPDX-License-Identifier: AGPL-3.0-or-later
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useUnsubscribeMutation } from "@/queries/account/unsubscribe.mutation";
import { ROUTES, routeFor } from "@/constants/routes";
import { fill, type TextKey } from "@/services/i18n.service";
import type { NoticeKind } from "@/types/models";
import type { AppContext } from "@/types/app-context";
const KIND_LABELS: Record<NoticeKind, TextKey> = {
  confirmation: "noticeKindConfirmation",
  change: "noticeKindChange",
  cancellation: "noticeKindCancellation",
  reminder: "noticeKindReminder",
  penalty: "noticeKindPenalty",
};
// The link only opens this page; a click confirms, so mail scanners that follow links change nothing.
export function useUnsubscribeController() {
  const context = useOutletContext<AppContext>();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const unsubscribe = useUnsubscribeMutation();
  const kind = unsubscribe.data?.kind;
  return {
    t: context.t,
    unsubscribe,
    done: kind
      ? fill(context.t("unsubscribeDone"), {
          kind: context.t(KIND_LABELS[kind]).toLocaleLowerCase(),
        })
      : null,
    invalid: !token || unsubscribe.isError,
    // The person changed that notice after the email was sent, so the link no longer applies.
    stale:
      (unsubscribe.error as { code?: string } | null)?.code ===
      "unsubscribe_stale",
    accountPath: routeFor(context.municipality.slug, ROUTES.account),
    confirm: () => unsubscribe.mutate(token),
  };
}
