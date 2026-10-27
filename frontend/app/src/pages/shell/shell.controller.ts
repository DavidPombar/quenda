// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useListMunicipalitiesQuery } from "@/queries/municipalities/list-municipalities.query";
import { useGetSessionQuery } from "@/queries/sessions/get-session.query";
import { useCreateSessionMutation } from "@/queries/sessions/create-session.mutation";
import { useDeleteSessionMutation } from "@/queries/sessions/delete-session.mutation";
import { useGetAuthMethodsQuery } from "@/queries/auth/get-auth-methods.query";
import { APP_BASE_PATH, ROUTES, routeFor } from "@/constants/routes";
import { translate, type TextKey } from "@/services/i18n.service";
import {
  AUTH_ERROR_PARAM,
  authErrorMessageKey,
  oidcStartUrl,
  withProvider,
} from "@/services/auth.service";
import { navigationService } from "@/services/navigation.service";
import type { Locale } from "@/types/models";
// Pages may hand the shell a one-off status line through navigation state.
const NOTICES: readonly TextKey[] = ["deleteDone"];
export function useShellController() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const authMethods = useGetAuthMethodsQuery();
  const municipalities = useListMunicipalitiesQuery();
  const sessionQuery = useGetSessionQuery();
  const create = useCreateSessionMutation();
  const remove = useDeleteSessionMutation();
  const [locale, setLocale] = useState<Locale>(
    localStorage.getItem("quenda.locale") === "es" ? "es" : "gl",
  );
  const [loginOpen, setLoginOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  // The backend sends failed eID logins back with ?authError=<code>; it is read
  // once on mount and then removed so a reload does not show it again.
  const [authError, setAuthError] = useState<string | null>(() =>
    searchParams.get(AUTH_ERROR_PARAM),
  );
  useEffect(() => {
    if (!searchParams.has(AUTH_ERROR_PARAM)) return;
    const next = new URLSearchParams(searchParams);
    next.delete(AUTH_ERROR_PARAM);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
  const municipality = municipalities.data?.find((item) => item.slug === slug);
  const session =
    sessionQuery.data?.role === "citizen" &&
    sessionQuery.data.tenantId === municipality?.id
      ? (sessionQuery.data ?? null)
      : null;
  const t = (key: TextKey) => translate(locale, key);
  const stateNotice = (location.state as { notice?: TextKey } | null)?.notice;
  const notice =
    stateNotice && NOTICES.includes(stateNotice) ? stateNotice : null;
  // Demo display names read "Name · role"; the person's name drives the initials.
  const [accountName = "", accountRole = ""] = (session?.displayName ?? "")
    .split("·")
    .map((part) => part.trim());
  const initials = accountName
    .split(/\s+/)
    .filter((part) => /^\p{L}/u.test(part))
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase())
    .join("");
  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem("quenda.locale", locale);
  }, [locale]);
  async function selectMunicipality(next: string) {
    if (sessionQuery.data) await remove.mutateAsync();
    await navigate(routeFor(next, ROUTES.catalog));
  }
  function closeLogin() {
    setLoginOpen(false);
    setConsent(false);
    create.reset();
  }
  function signInWithEid() {
    if (!municipality || !consent || !authMethods.data?.oidc) return;
    const query = new URLSearchParams(searchParams);
    query.delete(AUTH_ERROR_PARAM);
    const search = query.size ? `?${query.toString()}` : "";
    navigationService.assign(
      oidcStartUrl({
        slug: municipality.slug,
        legalVersion: municipality.legalVersion,
        returnTo: `${APP_BASE_PATH}${location.pathname}${search}`,
      }),
    );
  }
  function retryAuth() {
    setAuthError(null);
    setLoginOpen(true);
  }
  async function signIn() {
    if (!municipality || !consent) return;
    try {
      await create.mutateAsync({
        slug: municipality.slug,
        role: "citizen",
        legalVersion: municipality.legalVersion,
      });
      closeLogin();
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    municipalities,
    municipality,
    session,
    initials,
    accountName,
    accountRole:
      accountRole.charAt(0).toLocaleUpperCase() + accountRole.slice(1),
    locale,
    t,
    notice,
    setLocale,
    selectMunicipality,
    loginOpen,
    setLoginOpen,
    closeLogin,
    consent,
    setConsent,
    privacyOpen,
    setPrivacyOpen,
    signIn,
    signInWithEid,
    authMethods,
    eidButtonLabel: authMethods.data?.oidc
      ? withProvider(t("signInWithEid"), authMethods.data.oidc.label)
      : null,
    authErrorMessage: authError ? t(authErrorMessageKey(authError)) : null,
    retryAuth,
    dismissAuthError: () => setAuthError(null),
    create,
    remove,
    signOut: () => remove.mutate(),
    context: municipality
      ? {
          municipality,
          session,
          locale,
          t,
          signIn: () => setLoginOpen(true),
          showPrivacy: () => setPrivacyOpen(true),
        }
      : null,
  };
}
