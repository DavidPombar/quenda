// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Dialog, Portal } from "@chakra-ui/react";
import { fill, type TextKey } from "@/services/i18n.service";
import { useSessionTimeoutController } from "./session-timeout.controller";
const KEEP_ID = "session-keep";
export function SessionTimeout(props: {
  expiresAt: string | null | undefined;
  locale: string;
  t: (key: TextKey) => string;
  operator?: boolean;
  onEnded: () => void;
  onSignOut: () => void;
  onSignIn?: () => void;
}) {
  const c = useSessionTimeoutController(props);
  const { t } = props;
  return (
    <>
      <Dialog.Root
        open={c.warning}
        onOpenChange={(event) => {
          if (!event.open && !c.pending) c.dismissWarning();
        }}
        // Starts on the safe choice, keeping the session open.
        initialFocusEl={() => document.getElementById(KEEP_ID)}
        placement="center"
        role="alertdialog"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content className="modal">
              <Dialog.Header>
                <Dialog.Title>{t("sessionEndingTitle")}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Dialog.Description>
                  {fill(t("sessionEndingBody"), { time: c.endsAt })}
                </Dialog.Description>
                {c.failed && (
                  <p role="alert" className="error-text">
                    {t("sessionKeepFailed")}
                  </p>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={props.onSignOut}
                  disabled={c.pending}
                >
                  {t("sessionLeave")}
                </Button>
                <Button
                  id={KEEP_ID}
                  colorPalette="court"
                  size="lg"
                  onClick={c.keep}
                  loading={c.pending}
                >
                  {t("sessionKeep")}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      <Dialog.Root
        open={c.ended}
        onOpenChange={(event) => {
          if (!event.open) c.dismissEnded();
        }}
        placement="center"
        role="alertdialog"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content className="modal">
              <Dialog.Header>
                <Dialog.Title>{t("sessionEndedTitle")}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Dialog.Description>{t("sessionEndedBody")}</Dialog.Description>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" size="lg" onClick={c.dismissEnded}>
                  {t("close")}
                </Button>
                {props.onSignIn && (
                  <Button
                    colorPalette="court"
                    size="lg"
                    onClick={() => {
                      c.dismissEnded();
                      props.onSignIn?.();
                    }}
                  >
                    {t("sessionSignInAgain")}
                  </Button>
                )}
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
