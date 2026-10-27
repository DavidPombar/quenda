// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input, NativeSelect } from "@chakra-ui/react";
import { PiDownloadSimple } from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { useInsightsController } from "./insights.controller";
import { InsightTotals } from "./components/insight-totals/insight-totals.view";
import { OccupancyHeatmap } from "./components/occupancy-heatmap/occupancy-heatmap.view";
import { FacilityOccupancy } from "./components/facility-occupancy/facility-occupancy.view";
const LEVELS = [
  [0, "0 %"],
  [1, "1–24 %"],
  [2, "25–49 %"],
  [3, "50–74 %"],
  [4, "≥ 75 %"],
] as const;
export function Insights() {
  const c = useInsightsController();
  const { t } = c;
  const loading =
    c.insights.isPending ||
    (!!c.compare && !c.compareError && c.previous.isPending);
  const failed = c.insights.isError || c.previous.isError;
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>{t("insights")}</h1>
          <p className="page-subtitle">{t("insightsSubtitle")}</p>
        </div>
      </div>
      {!c.isManager ? (
        <div className="empty-state">
          <SpotArt kind="access" />
          <h2>{t("managerOnly")}</h2>
          <p>{t("managerPrompt")}</p>
          <Button colorPalette="court" onClick={c.signIn}>
            {t("signIn")}
          </Button>
        </div>
      ) : c.forbidden ? (
        <div className="empty-state" role="alert">
          <SpotArt kind="access" />
          <h2>{t("auditForbidden")}</h2>
        </div>
      ) : (
        <>
          <form
            className="insights-filters"
            aria-label={t("insightsFilters")}
            onSubmit={(event) => event.preventDefault()}
          >
            <Field.Root className="field">
              <Field.Label>{t("insightsPreset")}</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value=""
                  onChange={(event) =>
                    c.applyPreset(
                      event.target.value as Parameters<typeof c.applyPreset>[0],
                    )
                  }
                >
                  <option value="">{t("insightsPresetCustom")}</option>
                  {c.presets.map(([value, label]) => (
                    <option key={value} value={value}>
                      {t(label)}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <fieldset className="insights-range">
              <legend>{t("insightsPeriod")}</legend>
              <Field.Root className="field" invalid={!!c.periodError}>
                <Field.Label>{t("insightsFrom")}</Field.Label>
                <Input
                  type="date"
                  value={c.period.from}
                  onChange={(event) => c.setDate("from", event.target.value)}
                />
              </Field.Root>
              <Field.Root className="field" invalid={!!c.periodError}>
                <Field.Label>{t("insightsTo")}</Field.Label>
                <Input
                  type="date"
                  value={c.period.to}
                  onChange={(event) => c.setDate("to", event.target.value)}
                />
              </Field.Root>
              {c.periodError && (
                <p role="alert" className="error-text">
                  {t(c.periodError)}
                </p>
              )}
            </fieldset>
            <div className="checkbox-cell">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={!!c.compare}
                  onChange={(event) => c.toggleCompare(event.target.checked)}
                />
                {t("insightsCompare")}
              </label>
            </div>
            {c.compare && (
              <fieldset className="insights-range">
                <legend>{t("insightsComparePeriod")}</legend>
                <Field.Root className="field" invalid={!!c.compareError}>
                  <Field.Label>{t("insightsFrom")}</Field.Label>
                  <Input
                    type="date"
                    value={c.compare.from}
                    onChange={(event) =>
                      c.setDate("compareFrom", event.target.value)
                    }
                  />
                </Field.Root>
                <Field.Root className="field" invalid={!!c.compareError}>
                  <Field.Label>{t("insightsTo")}</Field.Label>
                  <Input
                    type="date"
                    value={c.compare.to}
                    onChange={(event) =>
                      c.setDate("compareTo", event.target.value)
                    }
                  />
                </Field.Root>
                {c.compareError && (
                  <p role="alert" className="error-text">
                    {t(c.compareError)}
                  </p>
                )}
              </fieldset>
            )}
          </form>
          {c.periodError || c.compareError ? null : failed ? (
            <Feedback
              message={t("loadError")}
              error
              retryLabel={t("retry")}
              retry={() => {
                void c.insights.refetch();
                void c.previous.refetch();
              }}
            />
          ) : loading || !c.insights.data ? (
            <Feedback message={t("loading")} />
          ) : (
            <div className="insights-results">
              <div className="insights-downloads">
                {[c.period, ...(c.compare ? [c.compare] : [])].map((range) => (
                  <a
                    key={`${range.from}-${range.to}`}
                    className="upload-calendar"
                    href={c.exportUrl(range)}
                    download
                  >
                    <PiDownloadSimple size={18} aria-hidden="true" />
                    {t("insightsDownload")} · {c.label(range)}
                  </a>
                ))}
              </div>
              <InsightTotals
                current={c.insights.data}
                previous={c.previous.data ?? null}
                t={t}
                locale={c.locale}
              />
              <section aria-labelledby="heatmap-title">
                <h2 id="heatmap-title" className="section-title">
                  {t("insightsHeatmap")}
                </h2>
                <p className="section-hint">{t("insightsHeatmapHint")}</p>
                <ul className="heat-legend" aria-label={t("insightsLegend")}>
                  {LEVELS.map(([level, label]) => (
                    <li key={level}>
                      <span
                        className={`heat heat-${level}`}
                        aria-hidden="true"
                      />
                      {label}
                    </li>
                  ))}
                  <li>
                    <span className="heat heat-closed" aria-hidden="true">
                      —
                    </span>
                    {t("insightsClosed")}
                  </li>
                </ul>
                {c.hours.length ? (
                  <div className={c.previous.data ? "heatmap-pair" : undefined}>
                    <OccupancyHeatmap
                      insights={c.insights.data}
                      caption={`${t("insightsHeatmapCaption")} ${c.label(c.period)}`}
                      hours={c.hours}
                      t={t}
                      locale={c.locale}
                    />
                    {c.compare && c.previous.data && (
                      <OccupancyHeatmap
                        insights={c.previous.data}
                        caption={`${t("insightsHeatmapCaption")} ${c.label(c.compare)}`}
                        hours={c.hours}
                        t={t}
                        locale={c.locale}
                      />
                    )}
                  </div>
                ) : (
                  <p className="section-hint">{t("insightsNoOpening")}</p>
                )}
              </section>
              <FacilityOccupancy
                current={c.insights.data}
                previous={c.previous.data ?? null}
                t={t}
                locale={c.locale}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
