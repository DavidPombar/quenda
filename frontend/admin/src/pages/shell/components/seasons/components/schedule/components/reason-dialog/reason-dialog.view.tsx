// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import {
  Button,
  Dialog,
  Field,
  NativeSelect,
  Portal,
  Textarea,
} from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import type { TextKey } from "@/services/i18n.service";
/** Asks why a season decision is taken; the reason goes to the audit journal. */
export function ReasonDialog(p: {
  title: string;
  description: string;
  /** When given, the manager picks one of these dates first. */
  dates?: { id: string; label: string }[];
  t: (key: TextKey) => string;
  pending: boolean;
  error: boolean;
  onConfirm: (reason: string, dateId: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [dateId, setDateId] = useState(p.dates?.[0]?.id ?? "");
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
                id="season-reason-form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!reason.trim()) {
                    setInvalid(true);
                    return;
                  }
                  p.onConfirm(reason.trim(), dateId);
                }}
              >
                {p.dates && (
                  <Field.Root className="field">
                    <Field.Label>{t("slotDate")}</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={dateId}
                        onChange={(event) => setDateId(event.target.value)}
                      >
                        {p.dates.map((date) => (
                          <option key={date.id} value={date.id}>
                            {date.label}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                )}
                <Field.Root className="field" required invalid={invalid}>
                  <Field.Label>
                    {t("cancelReason")}
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Textarea
                    value={reason}
                    onChange={(event) => {
                      setReason(event.target.value);
                      setInvalid(false);
                    }}
                  />
                  <Field.ErrorText>{t("reasonRequired")}</Field.ErrorText>
                </Field.Root>
                {p.error && (
                  <p role="alert" className="error-text">
                    {t("seasonError")}
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
                form="season-reason-form"
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
