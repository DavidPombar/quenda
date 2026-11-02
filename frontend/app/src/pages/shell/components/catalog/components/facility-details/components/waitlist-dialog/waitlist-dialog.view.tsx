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
import { keepFocus } from "@/services/page.service";
import type { AppContext } from "@/types/app-context";
import type { Slot, WaitlistEntry } from "@/types/models";
import { useWaitlistDialogController } from "./waitlist-dialog.controller";
export function WaitlistDialog(p: {
  context: AppContext;
  facilityId: string;
  facilityName: string;
  resourceId: string | null;
  /** Court name, empty when the facility has a single court. */
  resourceName: string;
  slot: Slot;
  entry: WaitlistEntry | null;
  onClose: () => void;
}) {
  const c = useWaitlistDialogController(p);
  const { t, municipality, locale } = p.context;
  return (
    <Dialog.Root
      open
      onOpenChange={(event) => {
        if (!event.open && !c.join.isPending) p.onClose();
      }}
      onExitComplete={() => keepFocus("#slots-title")}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="modal">
            <Dialog.Header>
              <Dialog.Title>{t("waitlistTitle")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <h3>{p.facilityName}</h3>
              <div className="booking-summary">
                {p.resourceName && (
                  <p>
                    <PiSquareHalf size={20} aria-hidden="true" />
                    <span className="sr-only">{t("resource")}: </span>
                    {p.resourceName}
                  </p>
                )}
                <p>
                  <PiCalendarBlank size={20} aria-hidden="true" />
                  {bookingDayLabel(p.slot.start, municipality.timezone, locale)}
                </p>
                <p>
                  <PiClock size={20} aria-hidden="true" />
                  {timeLabel(p.slot.start, municipality.timezone)} –{" "}
                  {timeLabel(p.slot.end, municipality.timezone)}
                </p>
              </div>
              {!p.entry && <p>{c.body}</p>}
              {/* Present from the start so joining is announced (WCAG 4.1.3). */}
              <div role="status">
                {c.status && (
                  <p className="success-body">
                    <PiCheckCircle size={22} aria-hidden="true" />
                    {c.status}
                  </p>
                )}
              </div>
              {c.join.error && (
                <p role="alert" className="error-text">
                  {c.join.error.message}
                </p>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {p.entry ? (
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
                    disabled={c.join.isPending}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    colorPalette="court"
                    size="lg"
                    onClick={c.submit}
                    loading={c.join.isPending}
                  >
                    {p.context.session ? t("waitlistJoin") : t("signIn")}
                  </Button>
                </>
              )}
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <Button
                variant="ghost"
                size="md"
                aria-label={t("close")}
                disabled={c.join.isPending}
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
