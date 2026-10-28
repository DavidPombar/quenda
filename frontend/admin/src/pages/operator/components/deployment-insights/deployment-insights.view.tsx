// SPDX-License-Identifier: AGPL-3.0-or-later
import { Field, Input } from "@chakra-ui/react";
import { Feedback } from "@/components/feedback/feedback.view";
import { useDeploymentInsightsController } from "./deployment-insights.controller";
export function DeploymentInsights() {
  const c = useDeploymentInsightsController();
  const { t } = c;
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>{t("operatorInsights")}</h1>
          <p className="page-subtitle">{t("operatorInsightsSubtitle")}</p>
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
      {c.error ? null : c.insights.isError ? (
        <Feedback
          message={t("loadError")}
          error
          retryLabel={t("retry")}
          retry={() => {
            void c.insights.refetch();
          }}
        />
      ) : c.insights.isPending ? (
        <Feedback message={t("loading")} />
      ) : (
        <div
          className="table-scroll"
          role="region"
          aria-labelledby="deployment-caption"
          tabIndex={0}
        >
          <table className="audit-table deployment-table">
            <caption id="deployment-caption">
              {t("operatorInsightsCaption")}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t("municipality")}</th>
                <th scope="col">{t("insightsOccupancy")}</th>
                <th scope="col">{t("insightsBookedHours")}</th>
                <th scope="col">{t("insightsOpenHours")}</th>
                <th scope="col">{t("insightsConfirmed")}</th>
                <th scope="col">{t("insightsCancelled")}</th>
                <th scope="col">{t("insightsNoShows")}</th>
                <th scope="col">{t("operatorFacilities")}</th>
              </tr>
            </thead>
            <tbody>
              {c.insights.data.municipalities.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.name}</th>
                  <td>{c.percent(row.occupancy)}</td>
                  <td>{c.hours(row.bookedMinutes)}</td>
                  <td>{c.hours(row.openMinutes)}</td>
                  <td>{row.confirmed}</td>
                  <td>{row.cancelled}</td>
                  <td>{row.noShows}</td>
                  <td>{row.facilities}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">{t("operatorTotal")}</th>
                <td>{c.percent(c.insights.data.occupancy)}</td>
                <td>{c.hours(c.insights.data.bookedMinutes)}</td>
                <td>{c.hours(c.insights.data.openMinutes)}</td>
                <td>{c.insights.data.confirmed}</td>
                <td>{c.insights.data.cancelled}</td>
                <td>{c.insights.data.noShows}</td>
                <td>{c.insights.data.facilities}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <p className="notice">{t("operatorPrivacy")}</p>
    </div>
  );
}
