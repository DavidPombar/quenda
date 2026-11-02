// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { Button, Dialog, Field, Portal, Textarea } from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import type { TextKey } from "@/services/i18n.service";
/** Asks why a session or an activity is cancelled; the reason goes to the audit journal. */
export function ReasonDialog(p: {
  title: string;
  description: string;
  t: (key: TextKey) => string;
  pending: boolean;
  error: boolean;
  onConfirm: (reason: string) => void;
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
              <Dialog.Title>{p.title}</Dialog.Title>
              <Dialog.Description className="modal-description">
                {p.description}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <form
                id="activity-reason-form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!reason.trim()) {
                    setInvalid(true);
                    return;
                  }
                  p.onConfirm(reason.trim());
                }}
              >
                <Field.Root className="field" required invalid={invalid}>
                  <Field.Label>
                    {t("cancelReason")}
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Textarea
                    value={reason}
                    maxLength={500}
                    onChange={(event) => {
                      setReason(event.target.value);
                      setInvalid(false);
                    }}
                  />
                  <Field.ErrorText>{t("reasonRequired")}</Field.ErrorText>
                </Field.Root>
                {p.error && (
                  <p role="alert" className="error-text">
                    {t("activityCancelError")}
                  </p>
                )}
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={p.onClose} disabled={p.pending}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                form="activity-reason-form"
                colorPalette="red"
                loading={p.pending}
              >
                {t("cancelConfirm")}
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
