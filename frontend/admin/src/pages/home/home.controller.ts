// SPDX-License-Identifier: AGPL-3.0-or-later
import { useListMunicipalitiesQuery } from "@/queries/municipalities/list-municipalities.query";
import { ROUTES, routeFor } from "@/constants/routes";
import { translate, type TextKey } from "@/services/i18n.service";
export function useHomeController() {
  const query = useListMunicipalitiesQuery();
  const locale = localStorage.getItem("quenda.locale") === "es" ? "es" : "gl";
  return {
    query,
    t: (key: TextKey) => translate(locale, key),
    operatorUrl: ROUTES.operator,
    managementUrl: (slug: string) => routeFor(slug, ROUTES.management),
  };
}
