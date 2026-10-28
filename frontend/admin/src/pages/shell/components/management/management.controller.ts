// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useListFacilitiesQuery } from "@/queries/facilities/list-facilities.query";
import { useGetInsightsQuery } from "@/queries/insights/get-insights.query";
import { useExportMunicipalityMutation } from "@/queries/portability/export-municipality.mutation";
import { saveJsonFile } from "@/services/download.service";
import type { AppContext } from "@/types/app-context";
import { periodLabel, money } from "@/services/date.service";
import type { Facility } from "@/types/models";
export function useManagementController() {
  const context = useOutletContext<AppContext>();
  const facilities = useListFacilitiesQuery(context.municipality.slug);
  const isManager = context.session?.role === "manager";
  const insights = useGetInsightsQuery(
    isManager ? context.session?.userId : undefined,
  );
  const [editing, setEditing] = useState<Facility | "new" | null>(null);
  const [saved, setSaved] = useState(false);
  const exporting = useExportMunicipalityMutation();
  function exportData() {
    exporting.mutate(undefined, {
      onSuccess: (data) =>
        saveJsonFile(
          `quenda-${data.municipality.slug}-${data.exportedAt.slice(0, 10)}.json`,
          data,
        ),
    });
  }
  function close(saved = false) {
    setEditing(null);
    setSaved(saved);
  }
  const activityTitle =
    insights.data?.from && insights.data.to
      ? `${context.t("activity")} ${periodLabel(insights.data.from, insights.data.to, context.locale)}`
      : context.t("activityLoading");
  const sportOf = (facilityId: string) =>
    facilities.data?.find((item) => item.id === facilityId)?.sport;
  const maxBookings = Math.max(
    1,
    ...(insights.data?.byFacility.map((item) => item.bookings) ?? []),
  );
  const price = (cents: number) =>
    cents === 0 ? context.t("free") : money(cents, context.locale);
  return {
    ...context,
    activityTitle,
    sportOf,
    maxBookings,
    price,
    facilities,
    insights,
    isManager,
    editing,
    setEditing,
    saved,
    close,
    exporting,
    exportData,
  };
}
