// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Dialog, Portal } from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import type { TextKey } from "@/services/i18n.service";
export function DeleteAccountDialog(p: {
  open: boolean;
  pending: boolean;
  error: string;
  t: (key: TextKey) => string;
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
      role="alertdialog"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="modal">
            <Dialog.Header>
              <Dialog.Title>{p.t("deleteTitle")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Dialog.Description>{p.t("deleteBody")}</Dialog.Description>
              {p.error && (
                <p role="alert" className="error-text">
                  {p.error}
                </p>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                size="lg"
                onClick={p.onClose}
                disabled={p.pending}
              >
                {p.t("cancel")}
              </Button>
              <Button
                colorPalette="red"
                size="lg"
                onClick={p.onConfirm}
                loading={p.pending}
              >
                {p.t("confirmDelete")}
              </Button>
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
