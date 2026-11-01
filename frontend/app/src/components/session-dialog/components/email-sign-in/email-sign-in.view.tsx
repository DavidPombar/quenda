// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input } from "@chakra-ui/react";
import { fill, type TextKey } from "@/services/i18n.service";
import type { Locale } from "@/types/models";
import { useEmailSignInController } from "./email-sign-in.controller";
/** Hint and, when there is one, the error: read with the field, not only announced once. */
function describedBy(field: string, error: string | null) {
  return error ? `${field}-hint ${field}-error` : `${field}-hint`;
}
// Light sign-in for one-off bookings: no password, a six-digit code mailed to the person.
export function EmailSignIn(props: {
  slug: string;
  legalVersion: string;
  locale: Locale;
  consent: boolean;
  t: (key: TextKey) => string;
  onSignedIn: () => void;
}) {
  const c = useEmailSignInController(props);
  const { t } = props;
  return (
    <section className="email-sign-in" aria-labelledby="email-sign-in-title">
      <h3 id="email-sign-in-title">{t("signInEmail")}</h3>
      {c.sentTo === null ? (
        <form
          noValidate
          aria-label={t("signInEmail")}
          onSubmit={(event) => {
            void c.send(event);
          }}
        >
          <Field.Root
            invalid={c.error !== null}
            ids={{ helperText: "email-hint", errorText: "email-error" }}
          >
            <Field.Label>{t("emailLabel")}</Field.Label>
            <Input
              ref={c.emailInput}
              aria-describedby={describedBy("email", c.error)}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={c.email}
              onChange={(event) => c.setEmail(event.target.value)}
            />
            <Field.HelperText>{t("signInEmailHint")}</Field.HelperText>
            {/* The error belongs to the field (WCAG 3.3.1) and is announced as it appears. */}
            {c.error && (
              <Field.ErrorText role="alert">{t(c.error)}</Field.ErrorText>
            )}
          </Field.Root>
          <Button
            type="submit"
            mt="3"
            colorPalette="court"
            variant="outline"
            loading={c.pending}
            disabled={!props.consent}
          >
            {t("emailSendCode")}
          </Button>
        </form>
      ) : (
        <form
          noValidate
          aria-label={t("emailEnterCode")}
          onSubmit={(event) => {
            void c.signIn(event);
          }}
        >
          <p role="status">{fill(t("emailCodeSent"), { email: c.sentTo })}</p>
          <Field.Root
            invalid={c.error !== null}
            ids={{ helperText: "code-hint", errorText: "code-error" }}
          >
            <Field.Label>{t("emailCodeLabel")}</Field.Label>
            <Input
              ref={c.codeInput}
              aria-describedby={describedBy("code", c.error)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={c.code}
              onChange={(event) => c.setCode(event.target.value)}
            />
            <Field.HelperText>{t("emailCodeHint")}</Field.HelperText>
            {c.error && (
              <Field.ErrorText role="alert">{t(c.error)}</Field.ErrorText>
            )}
          </Field.Root>
          {c.expiring && <p role="status">{t("emailCodeExpiring")}</p>}
          <div className="email-actions">
            <Button type="submit" colorPalette="court" loading={c.pending}>
              {t("emailSignIn")}
            </Button>
            <Button variant="ghost" onClick={c.resend} disabled={c.pending}>
              {t("emailResend")}
            </Button>
            <Button variant="ghost" onClick={c.changeEmail}>
              {t("emailChange")}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
