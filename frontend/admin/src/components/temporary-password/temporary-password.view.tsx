// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Dialog, Portal } from "@chakra-ui/react";
import type { TextKey } from "@/services/i18n.service";
import { useTemporaryPasswordController } from "./temporary-password.controller";
// The temporary password is shown only here, once; the person replaces it at the first sign-in.
export function TemporaryPassword(p: {
  t: (key: TextKey) => string;
  name: string;
  login: string;
  password: string;
  onClose: () => void;
}) {
  const c = useTemporaryPasswordController(p.password);
  const { t } = p;
  return (
    <Dialog.Root
      open
      role="alertdialog"
      onOpenChange={(event) => {
        if (!event.open) p.onClose();
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="modal">
            <Dialog.Header>
              <Dialog.Title>{t("temporaryPasswordTitle")}</Dialog.Title>
              <Dialog.Description className="modal-description">
                {p.name}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <p>{t("temporaryPasswordBody")}</p>
              <dl className="facts temporary-password">
                <div>
                  <dt>{t("staffLogin")}</dt>
                  <dd>
                    <code>{p.login}</code>
                  </dd>
                </div>
                <div>
                  <dt>{t("temporaryPasswordLabel")}</dt>
                  <dd>
                    <code>{p.password}</code>
                  </dd>
                </div>
              </dl>
              <p role="status" className="muted small">
                {c.copied ? t("temporaryPasswordCopied") : ""}
              </p>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={() => {
                  void c.copy();
                }}
              >
                {t("temporaryPasswordCopy")}
              </Button>
              <Button colorPalette="court" onClick={p.onClose}>
                {t("temporaryPasswordDone")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
