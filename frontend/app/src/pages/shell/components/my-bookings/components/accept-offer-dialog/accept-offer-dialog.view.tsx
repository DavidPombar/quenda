// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Dialog, Portal } from "@chakra-ui/react";
import {
  PiCalendarBlank,
  PiCheckCircle,
  PiClock,
  PiSquareHalf,
  PiX,
} from "react-icons/pi";
import { bookingDayLabel, timeLabel } from "@/services/date.service";
import { distinctResource } from "@/services/resources.service";
import type { AppContext } from "@/types/app-context";
import type { WaitlistEntry } from "@/types/models";
import { useAcceptOfferDialogController } from "./accept-offer-dialog.controller";
export function AcceptOfferDialog(p: {
  entry: WaitlistEntry;
  context: AppContext;
  onClose: () => void;
}) {
  const c = useAcceptOfferDialogController(p);
  const { t, municipality, locale } = p.context;
  const zone = municipality.timezone;
  const resource = distinctResource(p.entry.facilityName, p.entry.resourceName);
  return (
    <Dialog.Root
      open
      onOpenChange={(event) => {
        if (!event.open && !c.create.isPending) p.onClose();
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
                {c.create.isSuccess
                  ? t("bookingSuccess")
                  : t("acceptOfferTitle")}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {/* Present from the start so the confirmation is announced (WCAG 4.1.3). */}
              <div role="status">
                {c.create.isSuccess && (
                  <p className="success-body">
                    <PiCheckCircle size={22} aria-hidden="true" />
                    {t("bookingSuccessBody")}
                  </p>
                )}
              </div>
              <h3>{p.entry.facilityName}</h3>
              <div className="booking-summary">
                {resource && (
                  <p>
                    <PiSquareHalf size={20} aria-hidden="true" />
                    <span className="sr-only">{t("resource")}: </span>
                    {resource}
                  </p>
                )}
                <p>
                  <PiCalendarBlank size={20} aria-hidden="true" />
                  {bookingDayLabel(p.entry.start, zone, locale)}
                </p>
                <p>
                  <PiClock size={20} aria-hidden="true" />
                  {timeLabel(p.entry.start, zone)} –{" "}
                  {timeLabel(p.entry.end, zone)}
                </p>
              </div>
              {!c.create.isSuccess && <p>{c.deadline}</p>}
              <p className="muted small">{t("payAtVenue")}</p>
              {c.create.error && (
                <p role="alert" className="error-text">
                  {c.create.error.message}
                </p>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {c.create.isSuccess ? (
                <Button
                  colorPalette="court"
                  size="lg"
                  width="full"
                  onClick={p.onClose}
                  autoFocus
                >
                  {t("understood")}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={p.onClose}
                    disabled={c.create.isPending}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    colorPalette="court"
                    size="lg"
                    onClick={c.confirm}
                    loading={c.create.isPending}
                  >
                    {t("waitlistConfirm")}
                  </Button>
                </>
              )}
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <Button
                variant="ghost"
                size="md"
                aria-label={t("close")}
                disabled={c.create.isPending}
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
