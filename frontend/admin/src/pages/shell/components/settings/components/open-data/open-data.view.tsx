// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input, NativeSelect } from "@chakra-ui/react";
import type { TextKey } from "@/services/i18n.service";
import type { DataLicense, MunicipalitySettings } from "@/types/models";
import { useOpenDataController } from "./open-data.controller";
const LICENSE_LABELS = {
  "CC-BY-4.0": "licenseCcBy",
  "CC-BY-SA-4.0": "licenseCcBySa",
  "CC0-1.0": "licenseCc0",
  "ODbL-1.0": "licenseOdbl",
} as const satisfies Record<DataLicense, TextKey>;
export function OpenData(p: {
  settings: MunicipalitySettings;
  t: (key: TextKey) => string;
}) {
  const c = useOpenDataController(p);
  const { t } = p;
  return (
    <section className="settings-section" aria-labelledby="open-data-title">
      <h2 id="open-data-title">{t("openDataSection")}</h2>
      <p className="field-hint">{t("openDataHint")}</p>
      <form
        id="open-data-form"
        noValidate
        onSubmit={(event) => {
          void c.save(event);
        }}
      >
        <div className="form-grid settings-grid">
          <Field.Root className="field">
            <Field.Label>{t("dataLicenseLabel")}</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                name="dataLicense"
                value={c.license}
                onChange={(event) => c.setLicense(event.target.value)}
              >
                {c.licenses.map((license) => (
                  <option key={license} value={license}>
                    {t(LICENSE_LABELS[license])}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <Field.HelperText>{t("dataLicenseHint")}</Field.HelperText>
          </Field.Root>
          <Field.Root className="field" invalid={c.dir3Invalid}>
            <Field.Label>{t("dir3Label")}</Field.Label>
            <Input
              name="dir3Code"
              maxLength={9}
              autoComplete="off"
              spellCheck={false}
              value={c.dir3}
              onChange={(event) => c.setDir3(event.target.value)}
            />
            <Field.HelperText>{t("dir3Hint")}</Field.HelperText>
            {c.dir3Invalid && (
              <Field.ErrorText>{t("dir3Error")}</Field.ErrorText>
            )}
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
