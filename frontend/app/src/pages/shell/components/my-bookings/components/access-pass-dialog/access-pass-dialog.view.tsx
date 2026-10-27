// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Dialog, Portal } from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { bookingDayLabel, timeLabel } from "@/services/date.service";
import type { Booking } from "@/types/models";
import type { AppContext } from "@/types/app-context";
import { useAccessPassDialogController } from "./access-pass-dialog.controller";
export function AccessPassDialog(p: {
  booking: Booking;
  context: AppContext;
  onClose: () => void;
}) {
  const c = useAccessPassDialogController(p);
  const { t, municipality, locale } = p.context;
  return (
    <Dialog.Root
      open
      onOpenChange={(event) => {
        if (!event.open) p.onClose();
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="modal access-pass">
            <Dialog.Header>
              <Dialog.Title>{t("accessPassTitle")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <div className="cancel-summary">
                <strong>{p.booking.facilityName}</strong>
                <span>
                  {bookingDayLabel(
                    p.booking.start,
                    municipality.timezone,
                    locale,
                  )}
                  {" · "}
                  {timeLabel(p.booking.start, municipality.timezone)}–
                  {timeLabel(p.booking.end, municipality.timezone)}
                </span>
              </div>
              {c.query.isPending ? (
                <Feedback message={t("loading")} />
              ) : c.query.isError || !c.code ? (
                <Feedback
                  message={c.query.error?.message || t("loadError")}
                  error
                  retryLabel={t("retry")}
                  retry={() => {
                    void c.query.refetch();
                  }}
                />
              ) : (
                <>
                  <svg
                    className="access-code"
                    role="img"
                    aria-label={t("accessPassAlt")}
                    viewBox={`-4 -4 ${c.code.size + 8} ${c.code.size + 8}`}
                    shapeRendering="crispEdges"
                  >
                    <rect
                      x={-4}
                      y={-4}
                      width={c.code.size + 8}
                      height={c.code.size + 8}
                      fill="#fff"
                    />
                    <path d={c.code.path} fill="#000" />
                  </svg>
                  <p className="access-validity">{c.validity}</p>
                  <p className="muted">{t("accessPassHelp")}</p>
                </>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button colorPalette="court" size="lg" onClick={p.onClose}>
                {t("close")}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <Button variant="ghost" size="md" aria-label={t("close")}>
                <PiX size={20} aria-hidden="true" />
              </Button>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
