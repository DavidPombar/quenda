// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Dialog, Portal } from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import type { TextKey } from "@/services/i18n.service";
import { StaffSignIn } from "@/components/staff-sign-in/staff-sign-in.view";
export function SessionDialog(props: {
  open: boolean;
  onClose: () => void;
  onSelect: (role: "manager" | "access") => void;
  pending: boolean;
  error: string;
  t: (key: TextKey) => string;
  municipality: string;
  slug: string;
  /** Staff accounts with password and second factor (#8). */
  local: boolean;
  /** One-click synthetic accounts, only in the demo. */
  demo: boolean;
  onSignedIn: () => void;
}) {
  return (
    <Dialog.Root
      open={props.open}
      onOpenChange={(event) => {
        if (!event.open) props.onClose();
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="modal">
            <Dialog.Header>
              <Dialog.Title>
                {props.t(props.local ? "staffTitle" : "demoTitle")}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <p className="modal-meta">{props.municipality}</p>
              {props.local && (
                <StaffSignIn
                  slug={props.slug}
                  t={props.t}
                  onSignedIn={props.onSignedIn}
                />
              )}
              {props.demo && (
                <>
                  {props.local && (
                    <h3 className="login-divider">
                      {props.t("staffDemoDivider")}
                    </h3>
                  )}
                  <p>{props.t("demoBody")}</p>
                  <div className="login-options">
                    <Button
                      size="lg"
                      colorPalette="court"
                      onClick={() => props.onSelect("manager")}
                      loading={props.pending}
                    >
                      {props.t("manager")}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => props.onSelect("access")}
                      disabled={props.pending}
                    >
                      {props.t("accessStaff")}
                    </Button>
                  </div>
                </>
              )}
              {props.error && (
                <p role="alert" className="error-text">
                  {props.error}
                </p>
              )}
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <Button
                aria-label={props.t("close")}
                variant="ghost"
                size="md"
                px="0"
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
