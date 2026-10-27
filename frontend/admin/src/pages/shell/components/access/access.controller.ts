// SPDX-License-Identifier: AGPL-3.0-or-later
import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Temporal } from "@js-temporal/polyfill";
import { useListAccessKeysQuery } from "@/queries/access/list-access-keys.query";
import { useCheckInMutation } from "@/queries/access/check-in.mutation";
import { useListManagedBookingsQuery } from "@/queries/bookings/list-managed-bookings.query";
import {
  verifyCredential,
  type AccessClaims,
  type CredentialStatus,
} from "@/services/credential.service";
import {
  dropScan,
  queueScan,
  queuedScans,
} from "@/services/access-store.service";
import { timeLabel, today } from "@/services/date.service";
import type { AppContext } from "@/types/app-context";
import type { CheckIn, ManagedBooking } from "@/types/models";
export interface ScanOutcome {
  status: CredentialStatus | "no_keys" | "rejected";
  claims: AccessClaims | null;
  booking: ManagedBooking | null;
  checkIn: CheckIn | null;
  queued: boolean;
  error: string;
}
// The same QR held in front of the camera is read many times per second.
const REPEAT_MS = 4000;
/**
 * "Modo conserxe" (M3): the staff phone validates QR credentials offline with the municipality's
 * public key and records each entry, queueing it while there is no connection (C3 attendance).
 */
export function useAccessController() {
  const context = useOutletContext<AppContext>();
  const { municipality, t } = context;
  const allowed =
    context.session?.role === "manager" || context.session?.role === "staff";
  const tenantId = allowed ? municipality.id : undefined;
  const keys = useListAccessKeysQuery(tenantId);
  const date = today(municipality.timezone);
  const day = useListManagedBookingsQuery(tenantId, { date });
  const checkIn = useCheckInMutation();
  const [online, setOnline] = useState(() => navigator.onLine);
  const [pending, setPending] = useState(() =>
    tenantId ? queuedScans(tenantId).length : 0,
  );
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const last = useRef<{ token: string; at: number } | null>(null);
  const flushing = useRef(false);
  const record = checkIn.mutateAsync;
  const flush = useCallback(async () => {
    if (!tenantId || flushing.current) return;
    flushing.current = true;
    let synced = 0;
    try {
      for (const scan of queuedScans(tenantId)) {
        try {
          await record(scan);
        } catch (error) {
          // fetch rejects with a TypeError without a connection: the rest waits. A server
          // answer, accepted or not, settles the scan either way.
          if (error instanceof TypeError) break;
        }
        dropScan(tenantId, scan.token);
        synced++;
      }
    } finally {
      flushing.current = false;
      setPending(queuedScans(tenantId).length);
      if (synced) setSyncMessage(`${t("accessSynced")}: ${synced}`);
    }
  }, [tenantId, record, t]);
  useEffect(() => {
    const up = () => {
      setOnline(true);
      void flush();
    };
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    if (navigator.onLine) void flush();
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, [flush]);
  async function handleCode(raw: string) {
    const token = raw.trim();
    if (!token || !tenantId) return;
    const now = Temporal.Now.instant();
    if (
      last.current?.token === token &&
      now.epochMilliseconds - last.current.at < REPEAT_MS
    )
      return;
    last.current = { token, at: now.epochMilliseconds };
    setSyncMessage("");
    const base = {
      claims: null,
      booking: null,
      checkIn: null,
      queued: false,
      error: "",
    };
    if (!keys.data) {
      setOutcome({ ...base, status: "no_keys" });
      return;
    }
    const verdict = await verifyCredential(
      token,
      keys.data,
      now.epochMilliseconds / 1000,
    );
    const booking =
      day.data?.find((item) => item.id === verdict.claims?.sub) ?? null;
    const local = { ...base, ...verdict, booking };
    if (verdict.status !== "valid") {
      setOutcome(local);
      return;
    }
    const queue = () => {
      queueScan(tenantId, { token, scannedAt: now.toString() });
      setPending(queuedScans(tenantId).length);
      setOutcome({ ...local, queued: true });
    };
    if (!navigator.onLine) return queue();
    try {
      setOutcome({ ...local, checkIn: await record({ token }) });
    } catch (error) {
      if (error instanceof TypeError) queue();
      else
        setOutcome({
          ...local,
          status: "rejected",
          error: error instanceof Error ? error.message : "",
        });
    }
  }
  const timezone = municipality.timezone;
  return {
    ...context,
    allowed,
    keys,
    online,
    pending,
    outcome,
    syncMessage,
    manualCode,
    setManualCode,
    submitManual: async () => {
      await handleCode(manualCode);
      setManualCode("");
    },
    handleCode: (value: string) => {
      void handleCode(value);
    },
    retrySync: () => {
      void flush();
    },
    clearOutcome: () => setOutcome(null),
    window: (claims: AccessClaims) =>
      `${timeLabel(Temporal.Instant.fromEpochMilliseconds(claims.nbf * 1000).toString(), timezone)}–${timeLabel(
        Temporal.Instant.fromEpochMilliseconds(claims.exp * 1000).toString(),
        timezone,
      )}`,
  };
}
