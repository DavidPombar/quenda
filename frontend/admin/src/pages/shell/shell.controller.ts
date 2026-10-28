// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useListMunicipalitiesQuery } from "@/queries/municipalities/list-municipalities.query";
import { useGetSessionQuery } from "@/queries/sessions/get-session.query";
import { useCreateSessionMutation } from "@/queries/sessions/create-session.mutation";
import { useDeleteSessionMutation } from "@/queries/sessions/delete-session.mutation";
import { ROUTES, routeFor } from "@/constants/routes";
import { translate, type TextKey } from "@/services/i18n.service";
import { BRAND_VARIABLES, brandVariables } from "@/services/color.service";
import type { Locale } from "@/types/models";
export function useShellController() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const municipalities = useListMunicipalitiesQuery();
  const sessionQuery = useGetSessionQuery();
  const create = useCreateSessionMutation();
  const remove = useDeleteSessionMutation();
  // Only an explicit choice is stored; until then the municipality's default language applies.
  const [chosenLocale, setChosenLocale] = useState<Locale | null>(() => {
    const saved = localStorage.getItem("quenda.locale");
    return saved === "gl" || saved === "es" ? saved : null;
  });
  const [loginOpen, setLoginOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const municipality = municipalities.data?.find((item) => item.slug === slug);
  const locale: Locale = chosenLocale ?? municipality?.locale ?? "gl";
  function setLocale(next: Locale) {
    localStorage.setItem("quenda.locale", next);
    setChosenLocale(next);
  }
  // Staff sessions: managers, or access staff who only see the door.
  const session =
    (sessionQuery.data?.role === "manager" ||
      sessionQuery.data?.role === "access") &&
    sessionQuery.data.tenantId === municipality?.id
      ? (sessionQuery.data ?? null)
      : null;
  const isManager = session?.role === "manager";
  const isAccessStaff = session?.role === "access";
  const t = (key: TextKey) => translate(locale, key);
  // Demo display names look like "Uxía · xestión municipal": show the person, not the role.
  const accountName = session?.displayName.split("·")[0].trim() ?? "";
  const accountInitials = accountName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const primaryColor = municipality?.primaryColor ?? "";
  useEffect(() => {
    const style = document.documentElement.style;
    const variables = brandVariables(primaryColor);
    for (const name of BRAND_VARIABLES)
      if (variables[name]) style.setProperty(name, variables[name]);
      else style.removeProperty(name);
  }, [primaryColor]);
  async function selectMunicipality(next: string) {
    if (sessionQuery.data) await remove.mutateAsync();
    await navigate(routeFor(next, ROUTES.management));
  }
  async function signIn(role: "manager" | "access") {
    if (!municipality) return;
    try {
      await create.mutateAsync({ slug: municipality.slug, role });
      setLoginOpen(false);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  return {
    municipalities,
    municipality,
    session,
    isManager,
    isAccessStaff,
    accessPath: municipality ? routeFor(municipality.slug, ROUTES.access) : "",
    onAccessPage: location.pathname.endsWith(`/${ROUTES.access}`),
    accountName,
    accountInitials,
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
