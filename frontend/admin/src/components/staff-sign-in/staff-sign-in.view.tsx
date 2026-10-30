// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input } from "@chakra-ui/react";
import type { TextKey } from "@/services/i18n.service";
import { useStaffSignInController } from "./staff-sign-in.controller";
// Each step is its own form with visible labels; errors are announced and focus stays in the form.
export function StaffSignIn(props: {
  slug?: string;
  t: (key: TextKey) => string;
  onSignedIn: () => void;
}) {
  const c = useStaffSignInController(props);
  const { t } = props;
  return (
    <div className="staff-sign-in">
      {c.step === "credentials" && (
        <form
          noValidate
          aria-label={t("staffSignIn")}
          onSubmit={c.submitPassword}
        >
          <Field.Root>
            <Field.Label>{t("staffLogin")}</Field.Label>
            <Input
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={c.login}
              onChange={(event) => c.setLogin(event.target.value)}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>{t("staffPassword")}</Field.Label>
            <Input
              type="password"
              autoComplete="current-password"
              value={c.password}
              onChange={(event) => c.setPassword(event.target.value)}
            />
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
          <Field.Root>
            <Field.Label>{t("staffNewPassword")}</Field.Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={c.newPassword}
              onChange={(event) => c.setNewPassword(event.target.value)}
            />
            <Field.HelperText>{t("staffPasswordHint")}</Field.HelperText>
          </Field.Root>
          <Field.Root>
            <Field.Label>{t("staffRepeatPassword")}</Field.Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={c.repeat}
              onChange={(event) => c.setRepeat(event.target.value)}
            />
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
          <Field.Root>
            <Field.Label>{t("staffCode")}</Field.Label>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={c.code}
              onChange={(event) => c.setCode(event.target.value)}
            />
          </Field.Root>
          <Button type="submit" colorPalette="court" loading={c.pending}>
            {t("staffSignIn")}
          </Button>
        </form>
      )}
      {c.error && (
        <p role="alert" className="error-text">
          {t(c.error)}
        </p>
      )}
    </div>
  );
}
