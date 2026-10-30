// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMemo, useState, type FormEvent } from "react";
import { useStartStaffSignInMutation } from "@/queries/auth/start-staff-sign-in.mutation";
import { useChangeTemporaryPasswordMutation } from "@/queries/auth/change-temporary-password.mutation";
import { useCompleteStaffSignInMutation } from "@/queries/auth/complete-staff-sign-in.mutation";
import { qrPath } from "@/services/qr.service";
import type { TextKey } from "@/services/i18n.service";
import type { SignInStep } from "@/types/models";
const ERRORS: Record<string, TextKey> = {
  login_rejected: "staffLoginRejected",
  account_locked: "staffLocked",
  password_weak: "staffPasswordWeak",
  code_invalid: "staffCodeInvalid",
  login_expired: "staffExpired",
  local_accounts_unavailable: "staffUnavailable",
};
/**
 * Staff sign-in (#8): login and password, then, on the first time, a new password and the
 * authenticator app; afterwards the six-digit code. Municipal staff pass the municipality's slug;
 * operators do not.
 */
export function useStaffSignInController(args: {
  slug?: string;
  onSignedIn: () => void;
}) {
  const start = useStartStaffSignInMutation();
  const change = useChangeTemporaryPasswordMutation();
  const complete = useCompleteStaffSignInMutation(
    args.slug ? "tenant" : "operator",
  );
  const [step, setStep] = useState<SignInStep | null>(null);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<TextKey | null>(null);
  function fail(failure: unknown) {
    const code = (failure as { code?: string }).code ?? "";
    setError(ERRORS[code] ?? "staffError");
    // An expired step starts again from the password.
    if (code === "login_expired" || code === "account_locked") {
      setStep(null);
      setPassword("");
    }
  }
  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (failure) {
      fail(failure);
    }
  }
  const qr = useMemo(
    () => (step?.enrollment ? qrPath(step.enrollment.otpauthUri) : null),
    [step],
  );
  return {
    step: step?.step ?? "credentials",
    enrollment: step?.enrollment ?? null,
    qr,
    login,
    setLogin,
    password,
    setPassword,
    newPassword,
    setNewPassword,
    repeat,
    setRepeat,
    code,
    setCode: (value: string) => setCode(value.replace(/\D/g, "").slice(0, 6)),
    error,
    pending: start.isPending || change.isPending || complete.isPending,
    submitPassword: (event: FormEvent) => {
      event.preventDefault();
      void run(async () => {
        setStep(await start.mutateAsync({ slug: args.slug, login, password }));
        setPassword("");
      });
    },
    submitNewPassword: (event: FormEvent) => {
      event.preventDefault();
      if (newPassword !== repeat) {
        setError("staffPasswordMismatch");
        return;
      }
      void run(async () => {
        if (!step) return;
        setStep(await change.mutateAsync({ ticket: step.ticket, newPassword }));
        setNewPassword("");
        setRepeat("");
      });
    },
    submitCode: (event: FormEvent) => {
      event.preventDefault();
      if (!/^[0-9]{6}$/.test(code)) {
        setError("staffCodeFormat");
        return;
      }
      void run(async () => {
        if (!step) return;
        await complete.mutateAsync({ ticket: step.ticket, code });
        setCode("");
        args.onSignedIn();
      });
    },
  };
}
