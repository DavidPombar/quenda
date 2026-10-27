// SPDX-License-Identifier: AGPL-3.0-or-later
import { Link } from "react-router-dom";
import { Button, Dialog, Portal } from "@chakra-ui/react";
import {
  PiCalendarCheck,
  PiCalendarX,
  PiClockClockwise,
  PiSquareHalf,
  PiX,
} from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { ROUTES, routeFor } from "@/constants/routes";
import { dateLabel, bookingDayLabel, timeLabel } from "@/services/date.service";
import { distinctResource } from "@/services/resources.service";
import { BookingRow } from "./components/booking-row/booking-row.view";
import { ChangeBookingDialog } from "./components/change-booking-dialog/change-booking-dialog.view";
import { useMyBookingsController } from "./my-bookings.controller";
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
                  {c.visibleNotices.map((notice) => (
                    <li key={notice.id} className={notice.kind}>
                      {notice.kind === "confirmed" ? (
                        <PiCalendarCheck size={20} aria-hidden="true" />
                      ) : notice.kind === "cancelled" ? (
                        <PiCalendarX size={20} aria-hidden="true" />
                      ) : (
                        <PiClockClockwise size={20} aria-hidden="true" />
                      )}
                      <div>
                        <strong>
                          {c.t(
                            notice.kind === "confirmed"
                              ? "noticeConfirmed"
                              : notice.kind === "cancelled"
                                ? "noticeCancelled"
                                : "noticeRescheduled",
                          )}
                        </strong>
                        <p>{notice.facilityName}</p>
                        {distinctResource(
                          notice.facilityName,
                          notice.resourceName,
                        ) && (
                          <p className="resource-meta">
                            <PiSquareHalf size={16} aria-hidden="true" />
                            <span className="sr-only">{c.t("resource")}: </span>
                            {notice.resourceName}
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
                  ))}
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
                    {distinctResource(
                      c.cancelling.facilityName,
                      c.cancelling.resourceName,
                    ) && (
                      <span className="resource-meta">
                        <PiSquareHalf size={18} aria-hidden="true" />
                        <span className="sr-only">{c.t("resource")}: </span>
                        {c.cancelling.resourceName}
                      </span>
                    )}
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
