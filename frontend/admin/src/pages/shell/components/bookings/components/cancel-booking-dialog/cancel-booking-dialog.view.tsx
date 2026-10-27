// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { Button, Dialog, Field, Portal, Textarea } from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import type { TextKey } from "@/services/i18n.service";
import type { ManagedBooking } from "@/types/models";
export function CancelBookingDialog(p: {
  booking: ManagedBooking;
  time: string;
  t: (key: TextKey) => string;
  pending: boolean;
  error?: string;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [invalid, setInvalid] = useState(false);
  const { t } = p;
  return (
    <Dialog.Root
      open
      role="alertdialog"
      placement="center"
      onOpenChange={(event) => {
        if (!event.open && !p.pending) p.onClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="modal">
            <Dialog.Header>
              <Dialog.Title>{t("municipalCancelTitle")}</Dialog.Title>
              <Dialog.Description className="modal-description">
                {p.booking.displayName} · {p.booking.facilityName} · {p.time}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <form
                id="cancel-booking-form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  if (reason.trim().length < 3) {
                    setInvalid(true);
                    return;
                  }
                  p.onConfirm(reason.trim()).catch(() => {
                    /* The page shows the mutation error. */
                  });
                }}
              >
                <Field.Root className="field" required invalid={invalid}>
                  <Field.Label>
                    {t("closureReason")}
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Textarea
                    name="reason"
                    value={reason}
                    maxLength={500}
                    rows={3}
                    onChange={(event) => {
                      setReason(event.target.value);
                      setInvalid(false);
                    }}
                  />
                  <Field.HelperText>{t("closureReasonHint")}</Field.HelperText>
                  {invalid && (
                    <Field.ErrorText>
                      {t("closureReasonRequired")}
                    </Field.ErrorText>
                  )}
                </Field.Root>
                {p.error && (
                  <p role="alert" className="error-text">
                    {p.error}
                  </p>
                )}
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={p.onClose}
                disabled={p.pending}
              >
                {t("cancel")}
              </Button>
              <Button
                colorPalette="red"
                type="submit"
                form="cancel-booking-form"
                loading={p.pending}
              >
                {t("municipalCancelConfirm")}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <Button
                variant="ghost"
                size="md"
                px="0"
                aria-label={t("close")}
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
