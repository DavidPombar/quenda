// SPDX-License-Identifier: AGPL-3.0-or-later
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useListFacilitiesQuery } from "@/queries/facilities/list-facilities.query";
import type { AppContext } from "@/types/app-context";
export function useCatalogController() {
  const context = useOutletContext<AppContext>();
  const [params, setParams] = useSearchParams();
  const query = useListFacilitiesQuery(context.municipality.slug);
  const search = params.get("q") ?? "";
  const sport = params.get("sport") ?? "all";
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  const facilities =
    query.data?.filter(
      (item) =>
        (sport === "all" || item.sport === sport) &&
        `${item.name} ${item.address}`
          .toLocaleLowerCase(context.locale)
          .includes(search.toLocaleLowerCase(context.locale)),
    ) ?? [];
  return { ...context, query, search, sport, facilities, setFilter };
}
