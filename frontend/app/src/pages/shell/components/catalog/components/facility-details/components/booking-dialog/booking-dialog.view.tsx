// SPDX-License-Identifier: AGPL-3.0-or-later
import { Link } from "react-router-dom";
import { Button, Dialog, Portal } from "@chakra-ui/react";
import {
  PiCalendarBlank,
  PiCheckCircle,
  PiClock,
  PiSquareHalf,
  PiX,
} from "react-icons/pi";
import { bookingDayLabel, timeLabel, money } from "@/services/date.service";
import { ROUTES, routeFor } from "@/constants/routes";
import type { Facility, Slot, Municipality, Locale } from "@/types/models";
import type { TextKey } from "@/services/i18n.service";
export function BookingDialog(p: {
  open: boolean;
  slot: Slot | null;
  facility: Facility;
  /** Court name, empty when the facility has a single court. */
  resourceName: string;
  municipality: Municipality;
  locale: Locale;
  t: (key: TextKey) => string;
  pending: boolean;
  success: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root
      open={p.open}
      onOpenChange={(event) => {
        if (!event.open && !p.pending) p.onClose();
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="modal">
            <Dialog.Header>
              <Dialog.Title>
                {p.success ? p.t("bookingSuccess") : p.t("confirmTitle")}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {p.success && (
                <p className="success-body">
                  <PiCheckCircle size={22} aria-hidden="true" />
                  {p.t("bookingSuccessBody")}
                </p>
              )}
              <h3>{p.facility.name}</h3>
              {p.slot && (
                <div className="booking-summary">
                  {p.resourceName && (
                    <p>
                      <PiSquareHalf size={20} aria-hidden="true" />
                      <span className="sr-only">{p.t("resource")}: </span>
                      {p.resourceName}
                    </p>
                  )}
                  <p>
                    <PiCalendarBlank size={20} aria-hidden="true" />
                    {bookingDayLabel(
                      p.slot.start,
                      p.municipality.timezone,
                      p.locale,
                    )}
                  </p>
                  <p>
                    <PiClock size={20} aria-hidden="true" />
                    {timeLabel(p.slot.start, p.municipality.timezone)} –{" "}
                    {timeLabel(p.slot.end, p.municipality.timezone)}
                  </p>
                </div>
              )}
              <div className="total-line">
                <span>{p.t("total")}</span>
                <strong>
                  {p.facility.priceCents
                    ? money(p.facility.priceCents, p.locale)
                    : p.t("free")}
                </strong>
              </div>
              <p className="muted small">{p.t("payAtVenue")}</p>
              {p.error && (
                <p role="alert" className="error-text">
                  {p.error}
                </p>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {p.success ? (
                <Button asChild colorPalette="court" size="lg" width="full">
                  <Link to={routeFor(p.municipality.slug, ROUTES.bookings)}>
                    {p.t("done")}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={p.onClose}
                    disabled={p.pending}
                  >
                    {p.t("cancel")}
                  </Button>
                  <Button
                    colorPalette="court"
                    size="lg"
                    onClick={p.onConfirm}
                    loading={p.pending}
                  >
                    {p.t("confirmBooking")}
                  </Button>
                </>
              )}
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <Button
                variant="ghost"
                size="md"
                aria-label={p.t("close")}
                disabled={p.pending}
              >
                <PiX size={20} aria-hidden="true" />
              </Button>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
