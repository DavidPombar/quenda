// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
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
    ...pending.map((item) => item.bookingId),
  ]);
  function remember(items: CheckIn[]) {
    setPending(items);
    storePendingCheckIns(slug, items);
  }
  async function flush(items: CheckIn[]) {
    if (!items.length) return;
    try {
      const { results } = await record.mutateAsync(items);
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
      remember([]);
    } catch {
      /* Offline: the entries stay queued for the next sync. */
    }
  }
  function checkIn(booking: AccessBooking, method: CheckIn["method"]) {
    const next = [
      ...pending,
      {
        bookingId: booking.id,
        checkedInAt: Temporal.Now.instant().toString(),
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
    sync: async () => {
      await flush(pending);
      await dayQuery.refetch();
    },
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
