// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Temporal } from "@js-temporal/polyfill";
import { useListBookingsQuery } from "@/queries/bookings/list-bookings.query";
import { useListNotificationsQuery } from "@/queries/bookings/list-notifications.query";
import { useUpdateBookingMutation } from "@/queries/bookings/update-booking.mutation";
import type { AppContext } from "@/types/app-context";
import type { Booking } from "@/types/models";
// Most recent notices shown before "Ver todos".
const NOTICE_PREVIEW = 10;
export function useMyBookingsController() {
  const context = useOutletContext<AppContext>();
  const query = useListBookingsQuery(context.session?.userId);
  const notices = useListNotificationsQuery(context.session?.userId);
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [changing, setChanging] = useState<Booking | null>(null);
  const [showAllNotices, setShowAllNotices] = useState(false);
  const allNotices = notices.data ?? [];
  const visibleNotices = showAllNotices
    ? allNotices
    : allNotices.slice(0, NOTICE_PREVIEW);
  const update = useUpdateBookingMutation();
  const now = Temporal.Now.instant();
  const bookings =
    query.data
      ?.filter((booking) => {
        const upcoming =
          booking.status === "confirmed" &&
          Temporal.Instant.compare(Temporal.Instant.from(booking.end), now) > 0;
        return tab === "upcoming" ? upcoming : !upcoming;
      })
      .sort((a, b) =>
        tab === "upcoming"
          ? a.start.localeCompare(b.start)
          : b.start.localeCompare(a.start),
      ) ?? [];
  async function confirmCancel() {
    if (!cancelling) return;
    try {
      await update.mutateAsync({ id: cancelling.id, status: "cancelled" });
      setCancelling(null);
    } catch {
      /* Mutation state presents the error. */
    }
  }
  function canChange(booking: Booking) {
    return (
      booking.status === "confirmed" &&
      Temporal.Instant.compare(
        now.add({ hours: context.municipality.cancellationHours }),
        Temporal.Instant.from(booking.start),
      ) <= 0
    );
  }
  return {
    ...context,
    query,
    notices,
    visibleNotices,
    hiddenNotices: showAllNotices
      ? 0
      : allNotices.length - visibleNotices.length,
    showAllNotices: showAllNotices,
    toggleNotices: () => setShowAllNotices((value) => !value),
    tab,
    setTab,
    bookings,
    cancelling,
    setCancelling,
    changing,
    setChanging,
    update,
    confirmCancel,
    canChange,
  };
}
