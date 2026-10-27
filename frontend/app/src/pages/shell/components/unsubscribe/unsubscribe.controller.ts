// SPDX-License-Identifier: AGPL-3.0-or-later
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useUnsubscribeMutation } from "@/queries/account/unsubscribe.mutation";
import { ROUTES, routeFor } from "@/constants/routes";
import type { AppContext } from "@/types/app-context";
// The link only opens this page; a click confirms, so mail scanners that follow links change nothing.
export function useUnsubscribeController() {
  const context = useOutletContext<AppContext>();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const unsubscribe = useUnsubscribeMutation();
  return {
    t: context.t,
    unsubscribe,
    invalid: !token || unsubscribe.isError,
    accountPath: routeFor(context.municipality.slug, ROUTES.account),
    confirm: () => unsubscribe.mutate(token),
  };
}
