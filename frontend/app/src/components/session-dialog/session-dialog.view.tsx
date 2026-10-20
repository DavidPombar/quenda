// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Checkbox, Dialog, Portal, Text } from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import type { TextKey } from "@/services/i18n.service";
export function SessionDialog(props: {
  open: boolean;
  onClose: () => void;
  onSelect: () => void;
  pending: boolean;
  error: string;
  t: (key: TextKey) => string;
  municipality: string;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  onPrivacy: () => void;
}) {
  return (
    <Dialog.Root
      open={props.open}
      onOpenChange={(event) => {
        if (!event.open) props.onClose();
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="modal">
            <Dialog.Header>
              <Dialog.Title>{props.t("demoTitle")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text mb="6">
                {props.municipality}. {props.t("demoBody")}
              </Text>
              <div className="consent-block">
                <Checkbox.Root
                  className="consent-check"
                  colorPalette="court"
                  size="lg"
                  checked={props.consent}
                  disabled={props.pending}
                  onCheckedChange={(event) =>
                    props.onConsentChange(event.checked === true)
                  }
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>{props.t("consentLabel")}</Checkbox.Label>
                </Checkbox.Root>
                <button
                  type="button"
                  className="text-button"
                  onClick={props.onPrivacy}
                >
                  {props.t("readPrivacy")}
                </button>
              </div>
              <div className="login-options">
                <Button
                  size="lg"
                  colorPalette="court"
                  onClick={props.onSelect}
                  loading={props.pending}
                  disabled={!props.consent}
                >
                  {props.t("citizen")}
                </Button>
                {!props.consent && (
                  <p className="muted small">{props.t("consentRequired")}</p>
                )}
              </div>
              {props.error && (
                <p role="alert" className="error-text">
                  {props.error}
                </p>
              )}
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <Button aria-label={props.t("close")} variant="ghost" size="md">
                <PiX size={20} aria-hidden="true" />
              </Button>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
