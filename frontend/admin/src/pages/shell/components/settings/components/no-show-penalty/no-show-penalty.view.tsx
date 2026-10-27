// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input } from "@chakra-ui/react";
import type { TextKey } from "@/services/i18n.service";
import type { MunicipalitySettings } from "@/types/models";
import {
  PENALTY_FIELDS,
  useNoShowPenaltyController,
} from "./no-show-penalty.controller";
export function NoShowPenalty(p: {
  settings: MunicipalitySettings;
  t: (key: TextKey) => string;
}) {
  const c = useNoShowPenaltyController(p);
  const { t } = p;
  return (
    <section className="settings-section" aria-labelledby="no-show-title">
      <h2 id="no-show-title">{t("noShowSection")}</h2>
      <p className="field-hint">{t("noShowHint")}</p>
      <form
        id="no-show-form"
        noValidate
        onSubmit={(event) => {
          void c.save(event);
        }}
      >
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={c.enabled}
            onChange={(event) => c.setEnabled(event.target.checked)}
          />
          {t("noShowEnabled")}
        </label>
        {c.enabled && (
          <div className="form-grid settings-grid">
            {PENALTY_FIELDS.map(([key, min, max, label, error]) => (
              <Field.Root
                key={key}
                className="field"
                required
                invalid={!!c.errors[key]}
              >
                <Field.Label>
                  {t(label)}
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  name={key}
                  type="number"
                  inputMode="numeric"
                  min={min}
                  max={max}
                  step={1}
                  value={c.draft[key]}
                  onChange={(event) => c.setField(key, event.target.value)}
                />
                {c.errors[key] && <Field.ErrorText>{t(error)}</Field.ErrorText>}
              </Field.Root>
            ))}
          </div>
        )}
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
