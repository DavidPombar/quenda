// SPDX-License-Identifier: AGPL-3.0-or-later
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useGetInsightsRangeQuery } from "@/queries/insights/get-insights-range.query";
import { isForbiddenError } from "@/queries/audit/list-audit.query";
import { periodLabel, today } from "@/services/date.service";
import { exportUrl, monthRange, rangeError } from "@/services/insights.service";
import type { TextKey } from "@/services/i18n.service";
import type { AppContext } from "@/types/app-context";
import type { DateRange } from "@/types/models";
type DateKey = "from" | "to" | "compareFrom" | "compareTo";
export const PRESETS = [
  ["thisMonth", "insightsPresetThisMonth"],
  ["lastMonth", "insightsPresetLastMonth"],
  ["thisVsLast", "insightsPresetThisVsLast"],
  ["lastVsPrevious", "insightsPresetLastVsPrevious"],
  ["thisVsLastYear", "insightsPresetThisVsLastYear"],
] as const satisfies readonly (readonly [string, TextKey])[];
type Preset = (typeof PRESETS)[number][0];
export function useInsightsController() {
  const context = useOutletContext<AppContext>();
  const [params, setParams] = useSearchParams();
  const isManager = context.session?.role === "manager";
  const current = today(context.municipality.timezone);
  const fallback = monthRange(current);
  const period: DateRange = {
    from: params.get("from") ?? fallback.from,
    to: params.get("to") ?? fallback.to,
  };
  const comparing = params.has("compareFrom") || params.has("compareTo");
  const compare: DateRange | null = comparing
    ? {
        from: params.get("compareFrom") ?? "",
        to: params.get("compareTo") ?? "",
      }
    : null;
  const periodError = rangeError(period);
  const compareError = compare ? rangeError(compare) : null;
  const tenantId = isManager ? context.municipality.id : undefined;
  const insights = useGetInsightsRangeQuery(
    tenantId,
    periodError ? null : period,
  );
  const previous = useGetInsightsRangeQuery(
    tenantId,
    compare && !compareError ? compare : null,
  );
  function update(values: Partial<Record<DateKey, string | null>>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values))
      if (value) next.set(key, value);
      else next.delete(key);
    setParams(next, { replace: true });
  }
  function setDate(key: DateKey, value: string) {
    update({ [key]: value });
  }
  function toggleCompare(enabled: boolean) {
    const before = monthRange(period.from, -1);
    update(
      enabled
        ? { compareFrom: before.from, compareTo: before.to }
        : { compareFrom: null, compareTo: null },
    );
  }
  function applyPreset(preset: Preset | "") {
    if (!preset) return;
    const month = monthRange(current);
    const last = monthRange(current, -1);
    const ranges: Record<Preset, [DateRange, DateRange | null]> = {
      thisMonth: [month, null],
      lastMonth: [last, null],
      thisVsLast: [month, last],
      lastVsPrevious: [last, monthRange(current, -2)],
      thisVsLastYear: [month, monthRange(current, -12)],
    };
    const [main, other] = ranges[preset];
    update({
      from: main.from,
      to: main.to,
      compareFrom: other?.from ?? null,
      compareTo: other?.to ?? null,
    });
  }
  // Shared hour rows keep compared heatmaps aligned.
  const hours = [
    ...new Set(
      [
        ...(insights.data?.heatmap ?? []),
        ...(previous.data?.heatmap ?? []),
      ].map((cell) => cell.hour),
    ),
  ].sort((a, b) => a - b);
  const label = (range: DateRange) =>
    rangeError(range)
      ? ""
      : `${periodLabel(range.from, range.to, context.locale)} de ${range.to.slice(0, 4)}`;
  return {
    ...context,
    isManager,
    hours,
    label,
    period,
    compare,
    periodError,
    compareError,
    insights,
    previous,
    forbidden: isForbiddenError(insights.error),
    setDate,
    toggleCompare,
    applyPreset,
    presets: PRESETS,
    exportUrl,
  };
}
