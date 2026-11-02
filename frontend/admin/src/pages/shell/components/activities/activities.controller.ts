// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useListActivitiesQuery } from "@/queries/activities/list-activities.query";
import { useListFacilitiesQuery } from "@/queries/facilities/list-facilities.query";
import { useListSportsQuery } from "@/queries/sports/list-sports.query";
import type { AppContext } from "@/types/app-context";
/** Activities and sports schools (#97): the list, and the one being edited from the URL. */
export function useActivitiesController() {
  const context = useOutletContext<AppContext>();
  const isManager = context.session?.role === "manager";
  const activities = useListActivitiesQuery(isManager);
  const facilities = useListFacilitiesQuery(
    context.municipality.slug,
    isManager,
  );
  const sports = useListSportsQuery(isManager);
  const [params, setParams] = useSearchParams();
  // "nova" opens a blank editor; an id opens that activity.
  const editing = params.get("actividade");
  const selected =
    activities.data?.find((item) => item.id === editing) ?? null;
  // A new draft reopens as itself once saved; it says so there.
  const [created, setCreated] = useState<string | null>(null);
  return {
    ...context,
    isManager,
    activities,
    facilities,
    sports: (sports.data ?? []).filter((sport) => !sport.hidden),
    editing,
    selected,
    created,
    open: (id: string) => setParams({ actividade: id }, { replace: true }),
    saved: (id: string) => {
      setCreated(id);
      setParams({ actividade: id }, { replace: true });
    },
    close: () => setParams({}, { replace: true }),
  };
}
