// SPDX-License-Identifier: AGPL-3.0-or-later
import { useOutletContext } from "react-router-dom";
import { useGetMunicipalitySettingsQuery } from "@/queries/municipality-settings/get-municipality-settings.query";
import type { AppContext } from "@/types/app-context";
export function useSettingsController() {
  const context = useOutletContext<AppContext>();
  const isManager = context.session?.role === "manager";
  const settings = useGetMunicipalitySettingsQuery(
    isManager ? context.municipality.id : undefined,
  );
  return { ...context, isManager, settings };
}
