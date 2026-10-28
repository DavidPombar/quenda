// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Dialog, Portal } from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import type { AppContext } from "@/types/app-context";
import type { Booking } from "@/types/models";
import { useAccessPassDialogController } from "./access-pass-dialog.controller";
export function AccessPassDialog(p: {
  booking: Booking;
  context: AppContext;
  onClose: () => void;
}) {
  const c = useAccessPassDialogController(p);
  const { t } = p.context;
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
              <Dialog.Title>{t("passTitle")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <h3>{p.booking.facilityName}</h3>
              {c.query.isPending ? (
                <Feedback message={t("loading")} />
              ) : c.query.isError || !c.pass || !c.qr ? (
                <Feedback
                  message={t("passError")}
                  error
                  retryLabel={t("retry")}
                  retry={() => {
                    void c.query.refetch();
                  }}
                />
              ) : (
                <>
                  <p>{t("passIntro")}</p>
                  <svg
                    className="access-pass-qr"
                    role="img"
                    aria-label={c.imageLabel}
                    viewBox={`0 0 ${c.qr.size} ${c.qr.size}`}
                    shapeRendering="crispEdges"
                  >
                    <rect width={c.qr.size} height={c.qr.size} fill="#fff" />
                    <path d={c.qr.d} fill="#000" />
                  </svg>
                  <p className="access-pass-validity">{c.validity}</p>
                  <dl className="facts">
                    <div>
                      <dt>{t("passCode")}</dt>
                      <dd className="access-pass-code">{c.pass.code}</dd>
                    </div>
                  </dl>
                </>
              )}
            </Dialog.Body>
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
