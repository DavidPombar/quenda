// SPDX-License-Identifier: AGPL-3.0-or-later
import { useListMunicipalitiesQuery } from "@/queries/municipalities/list-municipalities.query";
import { ROUTES, routeFor } from "@/constants/routes";
export function useHomeController() {
  const query = useListMunicipalitiesQuery();
  return {
    query,
    destination: query.data?.[0]
      ? routeFor(query.data[0].slug, ROUTES.catalog)
      : null,
  };
}
