// SPDX-License-Identifier: AGPL-3.0-or-later
import type { CSSProperties } from "react";
import { Button, Field, Input } from "@chakra-ui/react";
import { PiTrash, PiUploadSimple } from "react-icons/pi";
import type { TextKey } from "@/services/i18n.service";
import type { MunicipalitySettings } from "@/types/models";
import { useBrandingController } from "./branding.controller";
export function Branding(p: {
  settings: MunicipalitySettings;
  t: (key: TextKey) => string;
}) {
  const c = useBrandingController(p);
  const { t } = p;
  return (
    <section className="settings-section" aria-labelledby="branding-title">
      <h2 id="branding-title">{t("brandingSection")}</h2>
      <p className="field-hint">{t("brandingHint")}</p>
      <form
        id="branding-form"
        noValidate
        onSubmit={(event) => {
          void c.saveColor(event);
        }}
      >
        <div className="form-grid settings-grid">
          <Field.Root className="field" invalid={!!c.colorError}>
            <Field.Label>{t("primaryColor")}</Field.Label>
            <div className="color-field">
              <input
                type="color"
                aria-label={t("colorPicker")}
                value={c.pickerValue}
                onChange={(event) => c.setColor(event.target.value)}
              />
              <Input
                name="primaryColor"
                maxLength={7}
                spellCheck={false}
                value={c.color}
                onChange={(event) => c.setColor(event.target.value)}
              />
            </div>
            <Field.HelperText>
              {t("contrastRatio")}: {c.ratio}:1 · {t("colorHint")}
            </Field.HelperText>
            {c.colorError && (
              <Field.ErrorText>{t(c.colorError)}</Field.ErrorText>
            )}
          </Field.Root>
          <div
            className="brand-preview"
            style={c.preview as CSSProperties}
            aria-hidden="true"
          >
            <span className="brand-preview-label">{t("colorPreview")}</span>
            <span className="brand-preview-button">{t("reserve")}</span>
            <span className="brand-preview-chip">{t("available")}</span>
          </div>
        </div>
        <div className="settings-actions">
          <Button
            type="submit"
            colorPalette="court"
            loading={c.update.isPending}
          >
            {t("save")}
          </Button>
          {c.colorSaved && (
            <p role="status" className="success-message">
              {t("settingsSaved")}
            </p>
          )}
          {c.update.error && (
            <p role="alert" className="error-text">
              {c.update.error.message}
            </p>
          )}
        </div>
      </form>
      <div className="logo-editor">
        <h3>{t("logo")}</h3>
        <div className="logo-row">
          <div className="logo-frame">
            {p.settings.logoUrl ? (
              <img src={p.settings.logoUrl} alt={t("logoAlt")} />
            ) : (
              <span className="muted">{t("logoNone")}</span>
            )}
          </div>
          <div className="logo-actions">
            <label className="upload-calendar">
              <PiUploadSimple size={18} aria-hidden="true" />
              {t("logoUpload")}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                  void c.uploadLogo(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            {p.settings.logoUrl && (
              <Button
                variant="outline"
                loading={c.remove.isPending}
                onClick={() => {
                  void c.removeLogo();
                }}
              >
                <PiTrash size={18} aria-hidden="true" />
                {t("logoRemove")}
              </Button>
            )}
            <p className="field-hint">{t("logoHint")}</p>
          </div>
        </div>
        {c.upload.isPending && <p role="status">{t("loading")}</p>}
        {c.logoMessage && (
          <p role="status" className="success-message">
            {t(c.logoMessage)}
          </p>
        )}
        {(c.logoError || c.logoServerError) && (
          <p role="alert" className="error-text">
            {c.logoError ? t(c.logoError) : c.logoServerError}
          </p>
        )}
      </div>
    </section>
  );
}
