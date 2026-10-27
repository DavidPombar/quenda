// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Textarea } from "@chakra-ui/react";
import type { TextKey } from "@/services/i18n.service";
import type { Locale, MunicipalitySettings } from "@/types/models";
import { useLegalTextsController } from "./legal-texts.controller";
const FIELDS = [
  ["gl", "legalGl"],
  ["es", "legalEs"],
] as const satisfies readonly (readonly [Locale, TextKey])[];
export function LegalTexts(p: {
  settings: MunicipalitySettings;
  t: (key: TextKey) => string;
  locale: Locale;
}) {
  const c = useLegalTextsController(p);
  const { t } = p;
  return (
    <section className="settings-section" aria-labelledby="legal-title">
      <h2 id="legal-title">{t("legalSection")}</h2>
      <p className="field-hint">{t("legalHint")}</p>
      <p className="settings-meta">
        {t("legalVersionLabel")}: <code>{p.settings.legalVersion}</code>
      </p>
      <form
        id="legal-form"
        noValidate
        onSubmit={(event) => {
          void c.save(event);
        }}
      >
        <div className="form-grid settings-grid">
          {FIELDS.map(([locale, label]) => (
            <Field.Root
              key={locale}
              className="field full"
              required
              invalid={c.invalid.includes(locale)}
            >
              <Field.Label>
                {t(label)}
                <Field.RequiredIndicator />
              </Field.Label>
              <Textarea
                name={`legal-${locale}`}
                lang={locale}
                rows={6}
                maxLength={20000}
                value={c.draft[locale]}
                onChange={(event) => c.setText(locale, event.target.value)}
              />
              {c.invalid.includes(locale) && (
                <Field.ErrorText>{t("legalError")}</Field.ErrorText>
              )}
            </Field.Root>
          ))}
        </div>
        <div className="settings-actions">
          <Button
            type="submit"
            colorPalette="court"
            loading={c.mutation.isPending}
            disabled={!c.changed}
          >
            {t("publishLegal")}
          </Button>
          {c.published && (
            <p role="status" className="success-message">
              {t("legalPublished")} <code>{c.published}</code>
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
