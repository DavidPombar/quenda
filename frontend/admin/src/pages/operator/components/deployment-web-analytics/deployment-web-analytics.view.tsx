// SPDX-License-Identifier: AGPL-3.0-or-later
import { Field, Input } from "@chakra-ui/react";
import { Feedback } from "@/components/feedback/feedback.view";
import { WebAnalyticsReport } from "@/components/web-analytics-report/web-analytics-report.view";
import { useDeploymentWebAnalyticsController } from "./deployment-web-analytics.controller";
export function DeploymentWebAnalytics() {
  const c = useDeploymentWebAnalyticsController();
  const { t } = c;
  const data = c.analytics.data;
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>{t("webAnalytics")}</h1>
          <p className="page-subtitle">{t("webAnalyticsSubtitle")}</p>
        </div>
      </div>
      <form
        className="audit-filters"
        aria-label={t("insightsFilters")}
        onSubmit={(event) => event.preventDefault()}
      >
        <Field.Root className="field">
          <Field.Label>{t("insightsFrom")}</Field.Label>
          <Input
            type="date"
            value={c.range.from}
            onChange={(event) => c.setDate("from", event.target.value)}
          />
        </Field.Root>
        <Field.Root className="field" invalid={!!c.error}>
          <Field.Label>{t("insightsTo")}</Field.Label>
          <Input
            type="date"
            value={c.range.to}
            onChange={(event) => c.setDate("to", event.target.value)}
          />
          {c.error && <Field.ErrorText>{t(c.error)}</Field.ErrorText>}
        </Field.Root>
      </form>
      {c.error ? null : c.analytics.isError ? (
        <Feedback
          message={t("webAnalyticsError")}
          error
          retryLabel={t("retry")}
          retry={() => {
            void c.analytics.refetch();
          }}
        />
      ) : c.analytics.isPending || !data ? (
        <Feedback message={t("loading")} />
      ) : !data.available ? (
        <p className="notice">{t("webAnalyticsUnavailable")}</p>
      ) : (
        <>
          {data.app && (
            <section aria-labelledby="web-app-title">
              <h2 id="web-app-title" className="section-title">
                {t("webApp")}
              </h2>
              <WebAnalyticsReport
                report={data.app}
                id="web-app"
                t={t}
                locale={c.locale}
              />
            </section>
          )}
          <div
            className="table-scroll"
            role="region"
            aria-labelledby="web-municipalities"
            tabIndex={0}
          >
            <table className="audit-table deployment-table">
              <caption id="web-municipalities">
                {t("webByMunicipality")}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t("municipality")}</th>
                  <th scope="col">{t("webVisitors")}</th>
                  <th scope="col">{t("webVisits")}</th>
                  <th scope="col">{t("webPageviews")}</th>
                </tr>
              </thead>
              <tbody>
                {data.municipalities.length ? (
                  data.municipalities.map((row) => (
                    <tr key={row.slug}>
                      <th scope="row">{row.name}</th>
                      <td>{c.count(row.visitors)}</td>
                      <td>{c.count(row.visits)}</td>
                      <td>{c.count(row.pageviews)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>{t("webNoData")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {data.web && (
            <section aria-labelledby="web-site-title">
              <h2 id="web-site-title" className="section-title">
                {t("webSite")}
              </h2>
              <WebAnalyticsReport
                report={data.web}
                id="web-site"
                t={t}
                locale={c.locale}
              />
            </section>
          )}
        </>
      )}
      <p className="notice">{t("operatorPrivacy")}</p>
    </div>
  );
}
