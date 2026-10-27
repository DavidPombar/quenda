// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input } from "@chakra-ui/react";
import type { TextKey } from "@/services/i18n.service";
import type { MunicipalitySettings } from "@/types/models";
import { RULES, useBookingRulesController } from "./booking-rules.controller";
export function BookingRules(p: {
  settings: MunicipalitySettings;
  t: (key: TextKey) => string;
}) {
  const c = useBookingRulesController(p);
  const { t } = p;
  return (
    <section className="settings-section" aria-labelledby="rules-title">
      <h2 id="rules-title">{t("bookingRulesSection")}</h2>
      <p className="field-hint">{t("bookingRulesHint")}</p>
      <form
        id="booking-rules-form"
        noValidate
        onSubmit={(event) => {
          void c.save(event);
        }}
      >
        <div className="form-grid settings-grid">
          {RULES.map(([key, min, max, label, error]) => (
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
