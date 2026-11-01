// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import { SESSION_ENDED_EVENT } from "@/constants/events";
import { useExtendSessionMutation } from "@/queries/sessions/extend-session.mutation";
/** Two minutes' notice gives well over the 20 seconds WCAG 2.2.1 asks for to extend. */
const WARNING_MS = 2 * 60_000;
/**
 * Warns before the session ends and offers to keep it open (WCAG 2.2.1); says so when it has
 * ended, also when the API answers 401 in the middle of something.
 */
export function useSessionTimeoutController(args: {
  expiresAt: string | null | undefined;
  locale: string;
  onEnded: () => void;
}) {
  const extension = useExtendSessionMutation();

  const { expiresAt, onEnded } = args;
  const [warning, setWarning] = useState(false);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    // Signed out (or ended): nothing left to warn about.
    setWarning(false);
    if (!expiresAt) return;
    const end = Date.parse(expiresAt);
    const finish = () => {
      setWarning(false);
      setEnded(true);
      onEnded();
    };
    const warn = window.setTimeout(
      () => setWarning(true),
      Math.max(0, end - WARNING_MS - Date.now()),
    );
    const stop = window.setTimeout(finish, Math.max(0, end - Date.now()));
    window.addEventListener(SESSION_ENDED_EVENT, finish);
    return () => {
      window.clearTimeout(warn);
      window.clearTimeout(stop);
      window.removeEventListener(SESSION_ENDED_EVENT, finish);
    };
  }, [expiresAt, onEnded]);
  async function keep() {
    setFailed(false);
    try {
      await extension.mutateAsync();
      setWarning(false);
    } catch {
      setFailed(true);
    }
  }
  return {
    warning,
    ended,
    pending: extension.isPending,
    failed,
    endsAt: expiresAt
      ? new Date(expiresAt).toLocaleTimeString(args.locale, {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    keep: () => void keep(),
    dismissWarning: () => setWarning(false),
    dismissEnded: () => setEnded(false),
  };
}
