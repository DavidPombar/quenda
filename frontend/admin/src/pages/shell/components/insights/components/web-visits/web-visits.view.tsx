// SPDX-License-Identifier: AGPL-3.0-or-later
import { Feedback } from "@/components/feedback/feedback.view";
import { WebAnalyticsReport } from "@/components/web-analytics-report/web-analytics-report.view";
import type { TextKey } from "@/services/i18n.service";
import type { DateRange, Locale } from "@/types/models";
import { useWebVisitsController } from "./web-visits.controller";
export function WebVisits(p: {
  tenantId: string;
  period: DateRange;
  t: (key: TextKey) => string;
  locale: Locale;
}) {
  const c = useWebVisitsController(p);
  const { t } = p;
  if (c.hidden) return null;
  return (
    <section aria-labelledby="web-visits-title">
      <h2 id="web-visits-title" className="section-title">
        {t("webAnalyticsSection")}
      </h2>
      <p className="section-hint">{t("webAnalyticsSectionHint")}</p>
      {c.analytics.isError ? (
        <Feedback
          message={t("webAnalyticsError")}
          error
          retryLabel={t("retry")}
          retry={() => {
            void c.analytics.refetch();
          }}
        />
      ) : c.analytics.isPending ? (
        <Feedback message={t("loading")} />
      ) : c.disabled ? (
        <p className="notice">{t("webAnalyticsDisabled")}</p>
      ) : (
        c.report && (
          <WebAnalyticsReport
            report={c.report}
            id="web-visits"
            t={t}
            locale={p.locale}
          />
        )
      )}
    </section>
  );
}
