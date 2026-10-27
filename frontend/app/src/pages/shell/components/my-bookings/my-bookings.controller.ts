// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Temporal } from "@js-temporal/polyfill";
import { useListBookingsQuery } from "@/queries/bookings/list-bookings.query";
import { useListNotificationsQuery } from "@/queries/bookings/list-notifications.query";
import { useUpdateBookingMutation } from "@/queries/bookings/update-booking.mutation";
import { useGetPenaltyStandingQuery } from "@/queries/bookings/get-penalty-standing.query";
import { dateLabel } from "@/services/date.service";
import { fill, type TextKey } from "@/services/i18n.service";
import type { AppContext } from "@/types/app-context";
import type { Booking, Notification, PenaltyStanding } from "@/types/models";
const NOTICE_TITLES = {
  confirmed: "noticeConfirmed",
  rescheduled: "noticeRescheduled",
  cancelled: "noticeCancelled",
  cancelled_by_municipality: "noticeCancelledByMunicipality",
  no_show: "noticeNoShow",
  blocked: "noticeBlocked",
  unblocked: "noticeUnblocked",
} as const satisfies Record<Notification["kind"], TextKey>;
// Most recent notices shown before "Ver todos".
const NOTICE_PREVIEW = 10;
// Bookings shown per page; "Ver máis" reveals the next page.
const BOOKING_PAGE = 10;
export function useMyBookingsController() {
  const context = useOutletContext<AppContext>();
  const query = useListBookingsQuery(context.session?.userId);
  const notices = useListNotificationsQuery(context.session?.userId);
  const penalty = useGetPenaltyStandingQuery(context.session?.userId);
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [changing, setChanging] = useState<Booking | null>(null);
  const [showingPass, setShowingPass] = useState<Booking | null>(null);
  const [showAllNotices, setShowAllNotices] = useState(false);
  const [bookingLimit, setBookingLimit] = useState(BOOKING_PAGE);
  const allNotices = notices.data ?? [];
  const visibleNotices = showAllNotices
    ? allNotices
    : allNotices.slice(0, NOTICE_PREVIEW);
  const update = useUpdateBookingMutation();
  const now = Temporal.Now.instant();
  const allBookings =
    query.data
      ?.filter((booking) => {
        const upcoming = booking.outcome === "upcoming";
        return tab === "upcoming" ? upcoming : !upcoming;
      })
      .sort((a, b) =>
        tab === "upcoming"
          ? a.start.localeCompare(b.start)
          : b.start.localeCompare(a.start),
      ) ?? [];
  const bookings = allBookings.slice(0, bookingLimit);
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
  const { t } = context;
  /** Where the person stands against the no-show penalty, in plain words (C3). */
  function standingText(standing: Omit<PenaltyStanding, "enabled">) {
    if (standing.blockedUntil)
      return fill(t("penaltyBlockedUntil"), {
        date: dateLabel(
          standing.blockedUntil,
          context.municipality.timezone,
          context.locale,
        ),
      });
    if (standing.limit === 0) return t("penaltyDisabled");
    return fill(t("penaltyRemaining"), {
      count: standing.count,
      windowDays: standing.windowDays,
      remaining: standing.remaining,
      blockDays: standing.blockDays,
    });
  }
  const standing = penalty.data;
  return {
    ...context,
    query,
    notices,
    penaltyMessage:
      standing &&
      (standing.blockedUntil || (standing.enabled && standing.count))
        ? standingText(standing)
        : "",
    blocked: !!standing?.blockedUntil,
    noticeTitle: (notice: Notification) => t(NOTICE_TITLES[notice.kind]),
    noticeDetail: (notice: Notification) =>
      notice.details?.reason ??
      (notice.details?.standing ? standingText(notice.details.standing) : ""),
    visibleNotices,
    hiddenNotices: Math.max(allNotices.length - NOTICE_PREVIEW, 0),
    showAllNotices,
    toggleNotices: () => setShowAllNotices((value) => !value),
    tab,
    setTab: (value: "upcoming" | "history") => {
      setTab(value);
      setBookingLimit(BOOKING_PAGE);
    },
    bookings,
    hiddenBookings: allBookings.length - bookings.length,
    showMoreBookings: () => setBookingLimit((value) => value + BOOKING_PAGE),
    cancelling,
    setCancelling,
    changing,
    setChanging,
    showingPass,
    setShowingPass,
    update,
    confirmCancel,
    canChange,
  };
}
