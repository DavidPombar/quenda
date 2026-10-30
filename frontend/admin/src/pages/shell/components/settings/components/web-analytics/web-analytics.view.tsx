// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Checkbox } from "@chakra-ui/react";
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
      {!c.available ? (
        <p className="field-hint">{t("analyticsUnavailable")}</p>
      ) : (
        <form
          id="web-analytics-form"
          noValidate
          onSubmit={(event) => {
            void c.save(event);
          }}
        >
          {c.off && <p className="field-hint">{t("analyticsOff")}</p>}
          <Checkbox.Root
            colorPalette="court"
            checked={c.enabled}
            onCheckedChange={(event) => c.setEnabled(event.checked === true)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>{t("analyticsToggle")}</Checkbox.Label>
          </Checkbox.Root>
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
      )}
    </section>
  );
}
