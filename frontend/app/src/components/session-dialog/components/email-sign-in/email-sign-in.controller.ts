// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRequestEmailCodeMutation } from "@/queries/auth/request-email-code.mutation";
import { useVerifyEmailCodeMutation } from "@/queries/auth/verify-email-code.mutation";
import { emailCodeErrorKey } from "@/services/auth.service";
import type { TextKey } from "@/services/i18n.service";
import type { Locale } from "@/types/models";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** The code lasts ten minutes (backend CODE_MINUTES); a minute before, the form says so. */
const CODE_MS = 10 * 60_000;
const WARNING_MS = 60_000;
/** Two steps: the address receives a code, then the code opens the session (#8). */
export function useEmailSignInController(args: {
  slug: string;
  legalVersion: string;
  locale: Locale;
  consent: boolean;
  onSignedIn: () => void;
}) {
  const request = useRequestEmailCodeMutation();
  const verify = useVerifyEmailCodeMutation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<TextKey | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [expiring, setExpiring] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);
  // Each step starts on its field, so keyboard and screen reader users follow the change.
  const step = sentTo === null ? "email" : "code";
  const shown = useRef(step);
  useEffect(() => {
    if (shown.current === step) return;
    shown.current = step;
    (step === "code" ? codeInput : emailInput).current?.focus();
  }, [step]);
  // WCAG 2.2.1: a warning before the code expires; asking for another one gives more time.
  useEffect(() => {
    if (sentAt === null) return;
    setExpiring(false);
    const timer = window.setTimeout(
      () => setExpiring(true),
      Math.max(0, sentAt + CODE_MS - WARNING_MS - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [sentAt]);
  async function send(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    const address = email.trim();
    if (!EMAIL.test(address)) {
      setError("emailInvalid");
      return;
    }
    if (!args.consent) {
      setError("consentRequired");
      return;
    }
    try {
      await request.mutateAsync({
        slug: args.slug,
        email: address,
        legalVersion: args.legalVersion,
        locale: args.locale,
      });
      setSentTo(address);
      setSentAt(Date.now());
      setCode("");
    } catch (failure) {
      setError(emailCodeErrorKey((failure as { code?: string }).code));
    }
  }
  async function signIn(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!sentTo) return;
    if (!/^[0-9]{6}$/.test(code.trim())) {
      setError("emailCodeFormat");
      return;
    }
    try {
      await verify.mutateAsync({
        slug: args.slug,
        email: sentTo,
        code: code.trim(),
      });
      args.onSignedIn();
    } catch (failure) {
      setError(emailCodeErrorKey((failure as { code?: string }).code));
    }
  }
  return {
    email,
    setEmail,
    code,
    setCode: (value: string) => setCode(value.replace(/\D/g, "").slice(0, 6)),
    sentTo,
    error,
    expiring,
    emailInput,
    codeInput,
    pending: request.isPending || verify.isPending,
    send,
    signIn,
    resend: () => {
      void send();
    },
    changeEmail: () => {
      setSentTo(null);
      setSentAt(null);
      setExpiring(false);
      setCode("");
      setError(null);
    },
  };
}
