// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input } from "@chakra-ui/react";
import type { TextKey } from "@/services/i18n.service";
import type { MunicipalitySettings } from "@/types/models";
import { useWebAnalyticsController } from "./web-analytics.controller";
export function WebAnalytics(p: {
  settings: MunicipalitySettings;
  t: (key: TextKey) => string;
}) {
  const c = useWebAnalyticsController(p);
  const { t } = p;
  return (
    <section className="settings-section" aria-labelledby="analytics-title">
      <h2 id="analytics-title">{t("analyticsSection")}</h2>
      <p className="field-hint">{t("analyticsHint")}</p>
      {c.off && <p className="field-hint">{t("analyticsOff")}</p>}
      <form
        id="web-analytics-form"
        noValidate
        onSubmit={(event) => {
          void c.save(event);
        }}
      >
        <div className="form-grid settings-grid">
          <Field.Root className="field" invalid={c.invalid}>
            <Field.Label>{t("analyticsUrlLabel")}</Field.Label>
            <Input
              name="analyticsUrl"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              maxLength={300}
              value={c.url}
              onChange={(event) => c.setUrl(event.target.value)}
            />
            <Field.HelperText>{t("analyticsUrlHint")}</Field.HelperText>
            {c.invalid && (
              <Field.ErrorText>{t("analyticsError")}</Field.ErrorText>
            )}
          </Field.Root>
          <Field.Root className="field" invalid={c.invalid}>
            <Field.Label>{t("analyticsWebsiteLabel")}</Field.Label>
            <Input
              name="analyticsWebsiteId"
              autoComplete="off"
              spellCheck={false}
              maxLength={36}
              value={c.website}
              onChange={(event) => c.setWebsite(event.target.value)}
            />
            <Field.HelperText>{t("analyticsWebsiteHint")}</Field.HelperText>
          </Field.Root>
        </div>
        <div className="settings-actions">
          <Button
            type="submit"
            colorPalette="court"
            loading={c.mutation.isPending}
          >
            {t("save")}
          </Button>
          {c.saved && (
            <p role="status" className="success-message">
              {t("settingsSaved")}
            </p>
          )}
          {c.mutation.error && (
            <p role="alert" className="error-text">
              {c.mutation.error.message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
