// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input, NativeSelect } from "@chakra-ui/react";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { useBookingsController } from "./bookings.controller";
import { CancelBookingDialog } from "./components/cancel-booking-dialog/cancel-booking-dialog.view";
export function Bookings() {
  const c = useBookingsController();
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>{c.t("dayBookings")}</h1>
          <p className="page-subtitle">{c.t("dayBookingsSubtitle")}</p>
        </div>
      </div>
      {!c.isManager ? (
        <div className="empty-state">
          <SpotArt kind="access" />
          <h2>{c.t("managerOnly")}</h2>
          <p>{c.t("managerPrompt")}</p>
          <Button colorPalette="court" onClick={c.signIn}>
            {c.t("signIn")}
          </Button>
        </div>
      ) : (
        <>
          <form
            className="audit-filters bookings-filters"
            aria-label={c.t("dayBookingsFilters")}
            onSubmit={(event) => event.preventDefault()}
          >
            <Field.Root className="field">
              <Field.Label>{c.t("bookingsDate")}</Field.Label>
              <Input
                type="date"
                value={c.date}
                onChange={(event) => c.setFilter("date", event.target.value)}
              />
            </Field.Root>
            <Field.Root className="field">
              <Field.Label>{c.t("bookingsFacility")}</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={c.facilityId}
                  onChange={(event) =>
                    c.setFilter("facility", event.target.value)
                  }
                >
                  <option value="">{c.t("allFacilities")}</option>
                  {c.facilities.data?.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
          </form>
          <p className="notice">{c.t("noShowRule")}</p>
          <div aria-live="polite">
            {c.message && (
              <p role="status" className="success-message">
                {c.message}
              </p>
            )}
            {c.mutation.error && !c.cancelling && (
              <p role="alert" className="error-text">
                {c.mutation.error.message}
              </p>
            )}
          </div>
          {c.bookings.isError ? (
            <Feedback
              message={c.t("loadError")}
              error
              retryLabel={c.t("retry")}
              retry={() => {
                void c.bookings.refetch();
              }}
            />
          ) : c.bookings.isPending ? (
            <Feedback message={c.t("loading")} />
          ) : c.bookings.data.length === 0 ? (
            <div className="empty-state">
              <SpotArt kind="search" size="sm" />
              <h2>{c.t("dayBookingsEmpty")}</h2>
              <p>{c.dateLabel}</p>
            </div>
          ) : (
            <div
              className="table-scroll"
              role="region"
              aria-labelledby="bookings-caption"
              tabIndex={0}
            >
              <table className="audit-table bookings-table">
                <caption id="bookings-caption">
                  {c.t("dayBookingsCaption")} {c.dateLabel}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{c.t("bookingsTime")}</th>
                    <th scope="col">{c.t("bookingsPerson")}</th>
                    <th scope="col">{c.t("bookingsFacility")}</th>
                    <th scope="col">{c.t("status")}</th>
                    <th scope="col">{c.t("bookingsActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.bookings.data.map((booking) => (
                    <tr key={booking.id}>
                      <td className="audit-time">{c.time(booking)}</td>
                      <th scope="row">{booking.displayName}</th>
                      <td>{booking.facilityName}</td>
                      <td>
                        <span className={`booking-outcome ${booking.outcome}`}>
                          {c.outcomeLabel(booking)}
                        </span>
                        {booking.cancellationReason && (
                          <span className="audit-role">
                            {booking.cancellationReason}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          {booking.canMarkNoShow && (
                            <Button
                              size="sm"
                              variant="outline"
                              colorPalette="red"
                              disabled={c.mutation.isPending}
                              aria-label={c.rowLabel("markNoShow", booking)}
                              onClick={() => {
                                void c.setAttendance(booking, "no_show");
                              }}
                            >
                              {c.t("markNoShow")}
                            </Button>
                          )}
                          {booking.canRevert && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={c.mutation.isPending}
                              aria-label={c.rowLabel("revertNoShow", booking)}
                              onClick={() => {
                                void c.setAttendance(booking, "attended");
                              }}
                            >
                              {c.t("revertNoShow")}
                            </Button>
                          )}
                          {booking.canCancel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              colorPalette="red"
                              disabled={c.mutation.isPending}
                              aria-label={c.rowLabel(
                                "municipalCancel",
                                booking,
                              )}
                              onClick={() => c.setCancelling(booking)}
                            >
                              {c.t("municipalCancel")}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {c.cancelling && (
            <CancelBookingDialog
              booking={c.cancelling}
              time={c.time(c.cancelling)}
              t={c.t}
              pending={c.mutation.isPending}
              error={c.mutation.error?.message}
              onConfirm={c.cancel}
              onClose={() => c.setCancelling(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
