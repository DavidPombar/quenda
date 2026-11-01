// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input, NativeSelect, Textarea } from "@chakra-ui/react";
import type { TextKey } from "@/services/i18n.service";
import type { MunicipalitySettings } from "@/types/models";
import { useAccessibilityStatementController } from "./accessibility-statement.controller";
/** The hint and, when there is one, the error, read with the field (WCAG 3.3.1). */
function describedBy(field: string, invalid: boolean) {
  return invalid ? `${field}-hint ${field}-error` : `${field}-hint`;
}
export function AccessibilityStatement(p: {
  settings: MunicipalitySettings;
  t: (key: TextKey) => string;
}) {
  const c = useAccessibilityStatementController(p);
  const { t } = p;
  return (
    <section
      className="settings-section"
      aria-labelledby="accessibility-statement-title"
    >
      <h2 id="accessibility-statement-title">{t("statementSection")}</h2>
      <p className="field-hint">{t("statementHint")}</p>
      <form
        id="accessibility-statement-form"
        noValidate
        onSubmit={(event) => {
          void c.save(event);
        }}
      >
        <div className="form-grid settings-grid">
          <Field.Root className="field">
            <Field.Label>{t("statementUnit")}</Field.Label>
            <Input
              name="unit"
              maxLength={200}
              value={c.statement.unit}
              onChange={(event) => c.update({ unit: event.target.value })}
            />
            <Field.HelperText>{t("statementUnitHint")}</Field.HelperText>
          </Field.Root>
          <Field.Root
            className="field"
            invalid={c.invalid === "email"}
            ids={{
              helperText: "statement-email-hint",
              errorText: "statement-email-error",
            }}
          >
            <Field.Label>{t("statementEmail")}</Field.Label>
            <Input
              name="email"
              aria-describedby={describedBy(
                "statement-email",
                c.invalid === "email",
              )}
              type="email"
              maxLength={254}
              value={c.statement.email}
              onChange={(event) => c.update({ email: event.target.value })}
            />
            <Field.HelperText>{t("statementEmailHint")}</Field.HelperText>
            {c.invalid === "email" && (
              <Field.ErrorText role="alert">
                {t("statementEmailError")}
              </Field.ErrorText>
            )}
          </Field.Root>
          <Field.Root className="field">
            <Field.Label>{t("statementPhone")}</Field.Label>
            <Input
              name="phone"
              type="tel"
              maxLength={40}
              value={c.statement.phone}
              onChange={(event) => c.update({ phone: event.target.value })}
            />
          </Field.Root>
          <Field.Root
            className="field"
            invalid={c.invalid === "reviewedOn"}
            ids={{
              helperText: "statement-date-hint",
              errorText: "statement-date-error",
            }}
          >
            <Field.Label>{t("statementReviewedOn")}</Field.Label>
            <Input
              name="reviewedOn"
              aria-describedby={describedBy(
                "statement-date",
                c.invalid === "reviewedOn",
              )}
              type="date"
              value={c.statement.reviewedOn}
              onChange={(event) => c.update({ reviewedOn: event.target.value })}
            />
            <Field.HelperText>{t("statementReviewedOnHint")}</Field.HelperText>
            {c.invalid === "reviewedOn" && (
              <Field.ErrorText role="alert">
                {t("statementReviewedOnError")}
              </Field.ErrorText>
            )}
          </Field.Root>
          <Field.Root className="field">
            <Field.Label>{t("statementMethod")}</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                name="method"
                value={c.statement.method}
                onChange={(event) =>
                  c.update({
                    method:
                      event.target.value === "external" ? "external" : "self",
                  })
                }
              >
                <option value="self">{t("statementMethodSelf")}</option>
                <option value="external">{t("statementMethodExternal")}</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
        </div>
        {(["gl", "es"] as const).map((locale) => (
          <Field.Root className="field" key={locale}>
            <Field.Label>
              {t(
                locale === "gl"
                  ? "statementExceptionsGl"
                  : "statementExceptionsEs",
              )}
            </Field.Label>
            <Textarea
              lang={locale}
              name={`exceptions-${locale}`}
              rows={4}
              maxLength={4000}
              value={c.statement.exceptions[locale]}
              onChange={(event) => c.setException(locale, event.target.value)}
            />
            <Field.HelperText>{t("statementExceptionsHint")}</Field.HelperText>
          </Field.Root>
        ))}
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
