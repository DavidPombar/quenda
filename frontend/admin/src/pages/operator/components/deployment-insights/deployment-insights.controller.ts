// SPDX-License-Identifier: AGPL-3.0-or-later
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useGetDeploymentInsightsQuery } from "@/queries/operator/get-deployment-insights.query";
import {
  hoursLabel,
  monthRange,
  percentLabel,
  rangeError,
} from "@/services/insights.service";
import { today } from "@/services/date.service";
import type { DateRange } from "@/types/models";
import type { OperatorContext } from "@/types/operator-context";
// Galician municipalities share this zone; it only picks the default month.
const DEFAULT_TIMEZONE = "Europe/Madrid";
export function useDeploymentInsightsController() {
  const context = useOutletContext<OperatorContext>();
  const [params, setParams] = useSearchParams();
  const fallback = monthRange(today(DEFAULT_TIMEZONE));
  const range: DateRange = {
    from: params.get("from") ?? fallback.from,
    to: params.get("to") ?? fallback.to,
  };
  const error = rangeError(range);
  const insights = useGetDeploymentInsightsQuery(
    context.session.operatorId,
    error ? undefined : range,
  );
  function setDate(key: "from" | "to", value: string) {
    const next = new URLSearchParams(params);
    next.set("from", range.from);
    next.set("to", range.to);
    next.set(key, value);
    setParams(next, { replace: true });
  }
  return {
    ...context,
    range,
    error,
    setDate,
    insights,
    hours: (minutes: number) => hoursLabel(minutes, context.locale),
    percent: percentLabel,
  };
}
