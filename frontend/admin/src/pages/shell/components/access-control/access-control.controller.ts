// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useRef, useState } from "react";
import { onlineManager } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { Temporal } from "@js-temporal/polyfill";
import { useGetAccessDayQuery } from "@/queries/access/get-access-day.query";
import { useRecordCheckInsMutation } from "@/queries/access/record-check-ins.mutation";
import { useManageBookingMutation } from "@/queries/bookings/manage-booking.mutation";
import { checkPass, type PassCheck } from "@/services/access-pass.service";
import {
  pendingCheckIns,
  storePendingCheckIns,
} from "@/services/access-store.service";
import { timeLabel } from "@/services/date.service";
import { fill, type TextKey } from "@/services/i18n.service";
import type { AppContext } from "@/types/app-context";
import type { AccessBooking, CheckIn, CheckInOutcome } from "@/types/models";
const REJECTIONS = {
  cancelled: "accessReasonCancelled",
  no_show: "accessReasonNoShow",
  out_of_window: "accessReasonWindow",
  not_found: "accessReasonNotFound",
  stale: "accessReasonStale",
} as const satisfies Partial<Record<CheckInOutcome, TextKey>>;
/**
 * Door mode: verifies passes against the last synced day, records entries and keeps those it
 * could not send in a local queue until the next sync.
 */
export function useAccessControlController() {
  const context = useOutletContext<AppContext>();
  const { t, municipality } = context;
  const slug = municipality.slug;
  const staff = context.session !== null;
  const dayQuery = useGetAccessDayQuery(slug, staff);
  const record = useRecordCheckInsMutation();
  const manage = useManageBookingMutation();
  const [pending, setPending] = useState<CheckIn[]>(() =>
    pendingCheckIns(slug),
  );
  const queue = useRef(pending);
  const syncing = useRef(false);
  // A sync asked for while another is sending runs once that one ends.
  const again = useRef(false);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [result, setResult] = useState<PassCheck | null>(null);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const day = dayQuery.data?.day ?? null;
  const entered = new Set([
    ...(day?.bookings
      .filter((item) => item.checkedInAt)
      .map((item) => item.id) ?? []),
    ...pending
      .filter((item) =>
        day?.bookings.some(
          (booking) =>
            booking.id === item.bookingId && booking.sequence === item.sequence,
        ),
      )
      .map((item) => item.bookingId),
  ]);
  function remember(items: CheckIn[]) {
    queue.current = items;
    setPending(items);
    storePendingCheckIns(slug, items);
  }
  async function flush(items: CheckIn[]) {
    if (!items.length) return;
    if (syncing.current) {
      again.current = true;
      return;
    }
    syncing.current = true;
    const batch = items.slice(0, 200);
    let delivered = false;
    try {
      const { results } = await record.mutateAsync(batch);
      const codes = new Map(day?.bookings.map((item) => [item.id, item.code]));
      setConflicts(
        results.flatMap(({ bookingId, outcome }) =>
          outcome in REJECTIONS
            ? [
                fill(t("accessConflict"), {
                  code: codes.get(bookingId) ?? bookingId.slice(0, 8),
                  reason: t(REJECTIONS[outcome as keyof typeof REJECTIONS]),
                }),
              ]
            : [],
        ),
      );
      const sent = new Set(
        batch.map(
          (item) => `${item.bookingId}:${item.sequence}:${item.checkedInAt}`,
        ),
      );
      remember(
        queue.current.filter(
          (item) =>
            !sent.has(`${item.bookingId}:${item.sequence}:${item.checkedInAt}`),
        ),
      );
      delivered = true;
    } catch {
      /* Offline: the entries stay queued for the next sync. */
    } finally {
      syncing.current = false;
    }
    const retry = again.current;
    again.current = false;
    if ((delivered || retry) && queue.current.length)
      await flush(queue.current);
  }
  async function sync() {
    await flush(queue.current);
    await dayQuery.refetch();
  }
  // Entries made offline go out as soon as the device is back on the network (#24).
  const latestSync = useRef(sync);
  latestSync.current = sync;
  useEffect(
    () =>
      onlineManager.subscribe((online) => {
        if (online && staff) void latestSync.current();
      }),
    [staff],
  );
  function checkIn(booking: AccessBooking, method: CheckIn["method"]) {
    const now = Temporal.Now.instant();
    if (booking.status !== "confirmed") {
      setResult({ result: "revoked", booking });
      return;
    }
    if (
      Temporal.Instant.compare(
        now,
        Temporal.Instant.from(booking.validFrom).subtract({ minutes: 1 }),
      ) < 0 ||
      Temporal.Instant.compare(
        now,
        Temporal.Instant.from(booking.end).add({ minutes: 1 }),
      ) > 0
    ) {
      setResult({ result: "out_of_window", booking });
      return;
    }
    if (
      booking.checkedInAt ||
      queue.current.some(
        (item) =>
          item.bookingId === booking.id && item.sequence === booking.sequence,
      )
    )
      return;
    const next = [
      ...queue.current,
      {
        bookingId: booking.id,
        sequence: booking.sequence,
        checkedInAt: now.toString(),
        method,
      },
    ];
    remember(next);
    void flush(next);
  }
  async function scanned(token: string) {
    if (!day) return;
    const check = await checkPass(
      token,
      day,
      entered,
      Math.floor(Temporal.Now.instant().epochMilliseconds / 1000),
    );
    setResult(check);
    if (check.result === "valid") checkIn(check.booking, "qr");
  }
  const query = search.trim().toLocaleLowerCase();
  const bookings = (day?.bookings ?? []).filter(
    (item) =>
      (!facilityId || item.facilityId === facilityId) &&
      (!query ||
        item.code.toLocaleLowerCase().includes(query) ||
        item.holder.toLocaleLowerCase().includes(query)),
  );
  const facilities = [
    ...new Map(
      (day?.bookings ?? []).map((item) => [item.facilityId, item.facilityName]),
    ),
  ];
  const zone = municipality.timezone;
  return {
    t,
    staff,
    signIn: context.signIn,
    dayQuery,
    day,
    offline: dayQuery.data?.offline ?? false,
    syncedLabel: day
      ? fill(t(dayQuery.data?.offline ? "accessOffline" : "accessSynced"), {
          time: timeLabel(day.syncedAt, zone),
        })
      : "",
    pendingLabel: pending.length
      ? fill(t("accessPending"), { count: pending.length })
      : "",
    sync,
    conflicts,
    result,
    scanning,
    toggleScanning: () => {
      setResult(null);
      setScanning((value) => !value);
    },
    scanned,
    search,
    setSearch,
    facilityId,
    setFacilityId,
    facilities,
    bookings,
    entered,
    time: (instant: string) => timeLabel(instant, zone),
    enteredLabel: (booking: AccessBooking) =>
      booking.checkedInAt
        ? fill(t("accessCheckedIn"), {
            time: timeLabel(booking.checkedInAt, zone),
          })
        : t("accessEntered"),
    checkIn: (booking: AccessBooking) => checkIn(booking, "manual"),
    manage,
    markNoShow: (booking: AccessBooking) =>
      manage.mutate(
        { id: booking.id, change: { attendance: "no_show" } },
        { onSuccess: () => void dayQuery.refetch() },
      ),
    canMarkNoShow: (booking: AccessBooking) =>
      booking.status === "confirmed" &&
      !entered.has(booking.id) &&
      Temporal.Instant.compare(
        Temporal.Instant.from(booking.start),
        Temporal.Now.instant(),
      ) <= 0,
  };
}
