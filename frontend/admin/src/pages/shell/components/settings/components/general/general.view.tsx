// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input, NativeSelect } from "@chakra-ui/react";
import type { TextKey } from "@/services/i18n.service";
import type { MunicipalitySettings } from "@/types/models";
import { useGeneralController } from "./general.controller";
export function General(p: {
  settings: MunicipalitySettings;
  t: (key: TextKey) => string;
}) {
  const c = useGeneralController(p);
  const { t } = p;
  return (
    <section className="settings-section" aria-labelledby="general-title">
      <h2 id="general-title">{t("generalSettingsSection")}</h2>
      <form
        id="general-form"
        noValidate
        onSubmit={(event) => {
          void c.save(event);
        }}
      >
        <div className="form-grid settings-grid">
          <Field.Root className="field" required invalid={c.contactInvalid}>
            <Field.Label>
              {t("contactLabel")}
              <Field.RequiredIndicator />
            </Field.Label>
            <Input
              name="contact"
              maxLength={500}
              value={c.contact}
              onChange={(event) => c.setContact(event.target.value)}
            />
            <Field.HelperText>{t("contactHint")}</Field.HelperText>
            {c.contactInvalid && (
              <Field.ErrorText>{t("contactError")}</Field.ErrorText>
            )}
          </Field.Root>
          <Field.Root className="field">
            <Field.Label>{t("defaultLanguage")}</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                name="locale"
                value={c.locale}
                onChange={(event) => c.setLocale(event.target.value)}
              >
                <option value="gl">{t("galician")}</option>
                <option value="es">{t("spanish")}</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <Field.HelperText>{t("defaultLanguageHint")}</Field.HelperText>
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
