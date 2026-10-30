// SPDX-License-Identifier: AGPL-3.0-or-later
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useGetDeploymentWebAnalyticsQuery } from "@/queries/operator/get-deployment-web-analytics.query";
import { rangeError } from "@/services/insights.service";
import { countLabel } from "@/services/web-analytics.service";
import { today } from "@/services/date.service";
import type { DateRange } from "@/types/models";
import type { OperatorContext } from "@/types/operator-context";
// Galician municipalities share this zone; it only picks the default week.
const DEFAULT_TIMEZONE = "Europe/Madrid";
function lastWeek(): DateRange {
  const to = today(DEFAULT_TIMEZONE);
  const from = new Date(`${to}T12:00:00Z`);
  from.setUTCDate(from.getUTCDate() - 6);
  return { from: from.toISOString().slice(0, 10), to };
}
export function useDeploymentWebAnalyticsController() {
  const context = useOutletContext<OperatorContext>();
  const [params, setParams] = useSearchParams();
  const fallback = lastWeek();
  const range: DateRange = {
    from: params.get("from") ?? fallback.from,
    to: params.get("to") ?? fallback.to,
  };
  const error = rangeError(range);
  const analytics = useGetDeploymentWebAnalyticsQuery(
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
    analytics,
    count: (value: number) => countLabel(value, context.locale),
  };
}
