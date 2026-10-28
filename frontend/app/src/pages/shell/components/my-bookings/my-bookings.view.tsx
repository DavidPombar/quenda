// SPDX-License-Identifier: AGPL-3.0-or-later
import { Link } from "react-router-dom";
import { Button, Dialog, Portal } from "@chakra-ui/react";
import {
  PiBell,
  PiCalendarCheck,
  PiCalendarX,
  PiCheckCircle,
  PiClockClockwise,
  PiProhibit,
  PiUserMinus,
  PiX,
} from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { ROUTES, routeFor } from "@/constants/routes";
import { dateLabel, bookingDayLabel, timeLabel } from "@/services/date.service";
import { BookingRow } from "./components/booking-row/booking-row.view";
import { CalendarFeed } from "./components/calendar-feed/calendar-feed.view";
import { ChangeBookingDialog } from "./components/change-booking-dialog/change-booking-dialog.view";
import { useMyBookingsController } from "./my-bookings.controller";
const NOTICE_ICONS = {
  confirmed: PiCalendarCheck,
  rescheduled: PiClockClockwise,
  cancelled: PiCalendarX,
  cancelled_by_municipality: PiCalendarX,
  no_show: PiUserMinus,
  blocked: PiProhibit,
  unblocked: PiCheckCircle,
  reminder: PiBell,
};
export function MyBookings() {
  const c = useMyBookingsController();
  return (
    <div className="page">
      <h1>{c.t("bookings")}</h1>
      <p className="page-subtitle">{c.t("myBookingsSubtitle")}</p>
      {!c.session ? (
        <div className="empty-state">
          <SpotArt kind="access" />
          <h2>{c.t("signedOut")}</h2>
          <p>{c.t("signedOutBody")}</p>
          <Button colorPalette="court" size="lg" onClick={c.signIn}>
            {c.t("signIn")}
          </Button>
        </div>
      ) : (
        <div className="bookings-layout">
          <section>
            {c.penaltyMessage && (
              <p
                className={`penalty-banner${c.blocked ? " blocked" : ""}`}
                role={c.blocked ? "alert" : "status"}
              >
                {c.penaltyMessage}
              </p>
            )}
            <div className="tabs" role="group" aria-label={c.t("bookings")}>
              {(["upcoming", "history"] as const).map((tab) => (
                <button
                  type="button"
                  key={tab}
                  aria-pressed={c.tab === tab}
                  className={c.tab === tab ? "selected" : ""}
                  onClick={() => c.setTab(tab)}
                >
                  {c.t(tab)}
                </button>
              ))}
            </div>
            {c.query.isPending ? (
              <Feedback message={c.t("loading")} />
            ) : c.query.isError ? (
              <Feedback
                message={c.t("loadError")}
                error
                retryLabel={c.t("retry")}
                retry={() => {
                  void c.query.refetch();
                }}
              />
            ) : c.bookings.length ? (
              <div className="booking-list">
                {c.bookings.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    municipality={c.municipality}
                    locale={c.locale}
                    t={c.t}
                    canChange={c.canChange(booking)}
                    calendarHref={c.calendarHref(booking.id)}
                    onCancel={() => {
                      c.update.reset();
                      c.setCancelling(booking);
                    }}
                    onChange={() => c.setChanging(booking)}
                  />
                ))}
                {c.hiddenBookings > 0 && (
                  <Button
                    variant="outline"
                    alignSelf="flex-start"
                    onClick={c.showMoreBookings}
                  >
                    {`${c.t("showMoreBookings")} (${c.hiddenBookings})`}
                  </Button>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <SpotArt kind="bookings" />
                <h2>{c.t("noBookings")}</h2>
                <p>{c.t("noBookingsBody")}</p>
                <Button asChild colorPalette="court" size="lg">
                  <Link to={routeFor(c.municipality.slug, ROUTES.catalog)}>
                    {c.t("browse")}
                  </Link>
                </Button>
              </div>
            )}
          </section>
          <aside className="notices-panel">
            <h2>{c.t("notices")}</h2>
            {c.notices.isError ? (
              <Feedback
                error
                message={c.t("loadError")}
                retryLabel={c.t("retry")}
                retry={() => {
                  void c.notices.refetch();
                }}
              />
            ) : c.visibleNotices.length ? (
              <>
                <ul>
                  {c.visibleNotices.map((notice) => {
                    const Icon = NOTICE_ICONS[notice.kind];
                    return (
                      <li key={notice.id} className={notice.kind}>
                        <Icon size={20} aria-hidden="true" />
                        <div>
                          <strong>{c.noticeTitle(notice)}</strong>
                          <p>{notice.facilityName}</p>
                          {c.noticeDetail(notice) && (
                            <p className="notice-detail">
                              {c.noticeDetail(notice)}
                            </p>
                          )}
                          <small>
                            {dateLabel(
                              notice.createdAt,
                              c.municipality.timezone,
                              c.locale,
                            )}
                          </small>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {c.hiddenNotices > 0 && (
                  <button
                    type="button"
                    className="text-button"
                    aria-expanded={c.showAllNotices}
                    onClick={c.toggleNotices}
                  >
                    {c.showAllNotices
                      ? c.t("showFewerNotices")
                      : `${c.t("showAllNotices")} (${c.hiddenNotices})`}
                  </button>
                )}
              </>
            ) : (
              <p className="muted">{c.t("noNotices")}</p>
            )}
            <CalendarFeed
              userId={c.session.userId}
              timezone={c.municipality.timezone}
              locale={c.locale}
              t={c.t}
            />
          </aside>
        </div>
      )}
      <Dialog.Root
        open={!!c.cancelling}
        onOpenChange={(event) => {
          if (!event.open && !c.update.isPending) c.setCancelling(null);
        }}
        placement="center"
        scrollBehavior="inside"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content className="modal">
              <Dialog.Header>
                <Dialog.Title>{c.t("cancelTitle")}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <p>{c.t("cancelBody")}</p>
                {c.cancelling && (
                  <div className="cancel-summary">
                    <strong>{c.cancelling.facilityName}</strong>
                    <span>
                      {bookingDayLabel(
                        c.cancelling.start,
                        c.municipality.timezone,
                        c.locale,
                      )}
                    </span>
                    <span>
                      {timeLabel(c.cancelling.start, c.municipality.timezone)}
                    </span>
                  </div>
                )}
                {c.update.error && (
                  <p role="alert" className="error-text">
                    {c.update.error.message}
                  </p>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => c.setCancelling(null)}
                  disabled={c.update.isPending}
                >
                  {c.t("cancel")}
                </Button>
                <Button
                  colorPalette="red"
                  size="lg"
                  onClick={() => {
                    void c.confirmCancel();
                  }}
                  loading={c.update.isPending}
                >
                  {c.t("confirmCancel")}
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button
                  variant="ghost"
                  size="md"
                  aria-label={c.t("close")}
                  disabled={c.update.isPending}
                >
                  <PiX size={20} aria-hidden="true" />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      {c.changing && (
        <ChangeBookingDialog
          booking={c.changing}
          onClose={() => c.setChanging(null)}
          context={{
            municipality: c.municipality,
            session: c.session,
            locale: c.locale,
            t: c.t,
            signIn: c.signIn,
            showPrivacy: c.showPrivacy,
          }}
        />
      )}
    </div>
  );
}
