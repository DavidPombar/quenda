// SPDX-License-Identifier: AGPL-3.0-or-later
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useGetOperatorSessionQuery } from "@/queries/operator/get-operator-session.query";
import { useCreateOperatorSessionMutation } from "@/queries/operator/create-operator-session.mutation";
import { useDeleteOperatorSessionMutation } from "@/queries/operator/delete-operator-session.mutation";
import { useGetAuthMethodsQuery } from "@/queries/auth/get-auth-methods.query";
import { translate, type TextKey } from "@/services/i18n.service";
import { followPage } from "@/services/page.service";
import type { Locale } from "@/types/models";
import type { OperatorContext } from "@/types/operator-context";
export function useOperatorController() {
  const session = useGetOperatorSessionQuery();
  const create = useCreateOperatorSessionMutation();
  const remove = useDeleteOperatorSessionMutation();
  const { refetch: refetchSession } = session;
  const sessionEnded = useCallback(() => {
    void refetchSession();
  }, [refetchSession]);
  const methods = useGetAuthMethodsQuery();
  // The deployment has no default language of its own; Galician unless the person chose.
  const [locale, setLocaleState] = useState<Locale>(() =>
    localStorage.getItem("quenda.locale") === "es" ? "es" : "gl",
  );
  function setLocale(next: Locale) {
    localStorage.setItem("quenda.locale", next);
    setLocaleState(next);
  }
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  // Title from the page heading; focus moves to it only after an in-app navigation.
  const pathname = useLocation().pathname;
  const lastPath = useRef<string | null>(null);
  const signedIn = Boolean(session.data);
  useEffect(() => {
    const focus = lastPath.current !== null && lastPath.current !== pathname;
    lastPath.current = pathname;
    return followPage("Quenda", focus);
  }, [pathname, locale, signedIn]);
  const t = (key: TextKey) => translate(locale, key);
  const context: OperatorContext | null = session.data
    ? { session: session.data, locale, t }
    : null;
  return {
    session,
    context,
    locale,
    setLocale,
    t,
    create,
    remove,
    local: methods.data?.local ?? false,
    demo: methods.data?.demo ?? false,
    signIn: () => create.mutate(),
    signOut: () => remove.mutate(),
    sessionEnded,
  };
}
