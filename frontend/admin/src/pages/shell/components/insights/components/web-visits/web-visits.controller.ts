// SPDX-License-Identifier: AGPL-3.0-or-later
import { useGetWebAnalyticsQuery } from "@/queries/insights/get-web-analytics.query";
import type { DateRange } from "@/types/models";
/** The council's citizen app visits for the period the page shows (#57). */
export function useWebVisitsController(args: {
  tenantId: string;
  period: DateRange;
}) {
  const analytics = useGetWebAnalyticsQuery(args.tenantId, args.period);
  const data = analytics.data;
  return {
    analytics,
    // Without an Umami in the deployment the section is not shown at all.
    hidden: !!data && !data.available,
    disabled: !!data && data.available && !data.enabled,
    report: data?.app ?? null,
  };
}
