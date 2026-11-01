// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input } from "@chakra-ui/react";
import type { TextKey } from "@/services/i18n.service";
import { useStaffSignInController } from "./staff-sign-in.controller";
const ERROR_ID = "staff-sign-in-error";
// Each step is its own form with visible labels. Focus moves to a new step's first field, and an
// error is tied to its field and announced (WCAG 2.4.3, 3.3.1).
export function StaffSignIn(props: {
  slug?: string;
  t: (key: TextKey) => string;
  onSignedIn: () => void;
}) {
  const c = useStaffSignInController(props);
  const { t } = props;
  const errorText = c.error && (
    <Field.ErrorText role="alert">{t(c.error)}</Field.ErrorText>
  );
  // One error at a time, read with every field it concerns (aria-describedby, not only
  // aria-errormessage, which several screen readers still ignore).
  const errorIds = { errorText: ERROR_ID };
  const describedBy = c.error ? ERROR_ID : undefined;
  // The password change has two fields; the weak-password error belongs to the first.
  const newPasswordError = c.error === "staffPasswordWeak";
  return (
    <div className="staff-sign-in">
      {c.step === "credentials" && (
        <form
          noValidate
          aria-label={t("staffSignIn")}
          onSubmit={c.submitPassword}
        >
          <Field.Root invalid={c.error !== null} ids={errorIds}>
            <Field.Label>{t("staffLogin")}</Field.Label>
            <Input
              ref={c.firstField}
              aria-describedby={describedBy}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={c.login}
              onChange={(event) => c.setLogin(event.target.value)}
            />
          </Field.Root>
          <Field.Root invalid={c.error !== null} ids={errorIds}>
            <Field.Label>{t("staffPassword")}</Field.Label>
            <Input
              aria-describedby={describedBy}
              type="password"
              autoComplete="current-password"
              value={c.password}
              onChange={(event) => c.setPassword(event.target.value)}
            />
            {errorText}
          </Field.Root>
          <Button type="submit" colorPalette="court" loading={c.pending}>
            {t("staffContinue")}
          </Button>
        </form>
      )}
      {c.step === "password_change" && (
        <form
          noValidate
          aria-label={t("staffNewPasswordTitle")}
          onSubmit={c.submitNewPassword}
        >
          <p role="status">{t("staffNewPasswordBody")}</p>
          <Field.Root
            invalid={newPasswordError}
            ids={{ ...errorIds, helperText: "staff-password-hint" }}
          >
            <Field.Label>{t("staffNewPassword")}</Field.Label>
            <Input
              ref={c.firstField}
              aria-describedby={
                newPasswordError
                  ? `staff-password-hint ${ERROR_ID}`
                  : "staff-password-hint"
              }
              type="password"
              autoComplete="new-password"
              value={c.newPassword}
              onChange={(event) => c.setNewPassword(event.target.value)}
            />
            <Field.HelperText>{t("staffPasswordHint")}</Field.HelperText>
            {newPasswordError && errorText}
          </Field.Root>
          <Field.Root
            invalid={c.error !== null && !newPasswordError}
            ids={errorIds}
          >
            <Field.Label>{t("staffRepeatPassword")}</Field.Label>
            <Input
              aria-describedby={newPasswordError ? undefined : describedBy}
              type="password"
              autoComplete="new-password"
              value={c.repeat}
              onChange={(event) => c.setRepeat(event.target.value)}
            />
            {!newPasswordError && errorText}
          </Field.Root>
          <Button type="submit" colorPalette="court" loading={c.pending}>
            {t("staffContinue")}
          </Button>
        </form>
      )}
      {(c.step === "enroll" || c.step === "totp") && (
        <form
          noValidate
          aria-label={t(
            c.step === "enroll" ? "staffEnrollTitle" : "staffCodeTitle",
          )}
          onSubmit={c.submitCode}
        >
          {c.step === "enroll" && c.enrollment && c.qr ? (
            <>
              <p role="status">{t("staffEnrollBody")}</p>
              <svg
                className="staff-qr"
                viewBox={`0 0 ${c.qr.size} ${c.qr.size}`}
                role="img"
                aria-label={t("staffEnrollQr")}
              >
                <rect width={c.qr.size} height={c.qr.size} fill="#fff" />
                <path d={c.qr.d} fill="#000" />
              </svg>
              <p className="muted small">{t("staffEnrollManual")}</p>
              <code className="staff-secret">
                {c.enrollment.secret.match(/.{1,4}/g)?.join(" ")}
              </code>
            </>
          ) : (
            <p role="status">{t("staffCodeBody")}</p>
          )}
          <Field.Root invalid={c.error !== null} ids={errorIds}>
            <Field.Label>{t("staffCode")}</Field.Label>
            <Input
              ref={c.firstField}
              aria-describedby={describedBy}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={c.code}
              onChange={(event) => c.setCode(event.target.value)}
            />
            {errorText}
          </Field.Root>
          <Button type="submit" colorPalette="court" loading={c.pending}>
            {t("staffSignIn")}
          </Button>
        </form>
      )}
      {c.step !== "credentials" && c.expiring && (
        <div role="status" className="staff-expiring">
          <p>{t("staffExpiring")}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={c.moreTime}
            loading={c.extending}
          >
            {t("staffMoreTime")}
          </Button>
        </div>
      )}
    </div>
  );
}
