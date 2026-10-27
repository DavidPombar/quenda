// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useListManagedBookingsQuery } from "@/queries/bookings/list-managed-bookings.query";
import { useManageBookingMutation } from "@/queries/bookings/manage-booking.mutation";
import { useListFacilitiesQuery } from "@/queries/facilities/list-facilities.query";
import {
  fullDateLabel,
  isPlainDate,
  timeLabel,
  today,
} from "@/services/date.service";
import type { TextKey } from "@/services/i18n.service";
import type { AppContext } from "@/types/app-context";
import type { BookingOutcome, ManagedBooking } from "@/types/models";
const OUTCOME_LABELS = {
  upcoming: "outcomeUpcoming",
  attended: "outcomeAttended",
  no_show: "outcomeNoShow",
  cancelled: "outcomeCancelled",
} as const satisfies Record<BookingOutcome, TextKey>;
/** Day sheet for attendance (C3, M3): no-shows on the day, corrections and municipal cancellations. */
export function useBookingsController() {
  const context = useOutletContext<AppContext>();
  const [params, setParams] = useSearchParams();
  const timezone = context.municipality.timezone;
  const isManager = context.session?.role === "manager";
  const date = isPlainDate(params.get("date") ?? "")
    ? (params.get("date") ?? "")
    : today(timezone);
  const facilities = useListFacilitiesQuery(context.municipality.slug);
  const facilityId = facilities.data?.some(
    (item) => item.id === params.get("facility"),
  )
    ? (params.get("facility") ?? "")
    : "";
  const bookings = useListManagedBookingsQuery(
    isManager ? context.municipality.id : undefined,
    { date, ...(facilityId && { facilityId }) },
  );
  const mutation = useManageBookingMutation();
  const [cancelling, setCancelling] = useState<ManagedBooking | null>(null);
  const [message, setMessage] = useState("");
  function setFilter(key: "date" | "facility", value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setMessage("");
  }
  const t = context.t;
  const time = (booking: ManagedBooking) =>
    `${timeLabel(booking.start, timezone)}–${timeLabel(booking.end, timezone)}`;
  async function setAttendance(
    booking: ManagedBooking,
    attendance: "no_show" | "attended",
  ) {
    setMessage("");
    try {
      await mutation.mutateAsync({ id: booking.id, change: { attendance } });
      setMessage(
        `${t(attendance === "no_show" ? "noShowMarked" : "noShowReverted")}: ${booking.displayName}`,
      );
    } catch {
      /* Mutation state presents the error. */
    }
  }
  async function cancel(reason: string) {
    if (!cancelling) return;
    await mutation.mutateAsync({
      id: cancelling.id,
      change: { status: "cancelled", reason },
    });
    setMessage(`${t("municipalCancelDone")}: ${cancelling.displayName}`);
    setCancelling(null);
  }
  return {
    ...context,
    isManager,
    date,
    dateLabel: fullDateLabel(date, context.locale),
    isToday: date === today(timezone),
    facilityId,
    facilities,
    bookings,
    mutation,
    message,
    setFilter,
    setAttendance,
    cancelling,
    setCancelling: (booking: ManagedBooking | null) => {
      mutation.reset();
      setCancelling(booking);
    },
    cancel,
    time,
    rowLabel: (key: TextKey, booking: ManagedBooking) =>
      `${t(key)}: ${booking.displayName}, ${time(booking)}`,
    outcomeLabel: (booking: ManagedBooking) =>
      t(
        booking.outcome === "cancelled" &&
          booking.cancelledBy === "municipality"
          ? "outcomeCancelledByMunicipality"
          : OUTCOME_LABELS[booking.outcome],
      ),
  };
}
