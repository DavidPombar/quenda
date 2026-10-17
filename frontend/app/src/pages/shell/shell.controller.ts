// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useListMunicipalitiesQuery } from "@/queries/municipalities/list-municipalities.query";
import { useGetSessionQuery } from "@/queries/sessions/get-session.query";
import { useCreateSessionMutation } from "@/queries/sessions/create-session.mutation";
import { useDeleteSessionMutation } from "@/queries/sessions/delete-session.mutation";
import { ROUTES, routeFor } from "@/constants/routes";
import { translate, type TextKey } from "@/services/i18n.service";
import type { Locale } from "@/types/models";
export function useShellController() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const municipalities = useListMunicipalitiesQuery();
  const sessionQuery = useGetSessionQuery();
  const create = useCreateSessionMutation();
  const remove = useDeleteSessionMutation();
  const [locale, setLocale] = useState<Locale>(
    localStorage.getItem("quenda.locale") === "es" ? "es" : "gl",
  );
  const [loginOpen, setLoginOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const municipality = municipalities.data?.find((item) => item.slug === slug);
  const session =
    sessionQuery.data?.role === "citizen" &&
    sessionQuery.data.tenantId === municipality?.id
      ? (sessionQuery.data ?? null)
      : null;
  const t = (key: TextKey) => translate(locale, key);
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
  async function signIn() {
    if (!municipality) return;
    try {
      await create.mutateAsync({ slug: municipality.slug, role: "citizen" });
      setLoginOpen(false);
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
    setLocale,
    selectMunicipality,
    loginOpen,
    setLoginOpen,
    privacyOpen,
    setPrivacyOpen,
    signIn,
    create,
    remove,
    signOut: () => remove.mutate(),
    context: municipality
      ? { municipality, session, locale, t, signIn: () => setLoginOpen(true) }
      : null,
  };
}
