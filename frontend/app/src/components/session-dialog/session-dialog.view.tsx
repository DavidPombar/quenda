// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Checkbox, Dialog, Portal, Text } from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import type { TextKey } from "@/services/i18n.service";
import type { Locale } from "@/types/models";
import { EmailSignIn } from "./components/email-sign-in/email-sign-in.view";
export function SessionDialog(props: {
  open: boolean;
  onClose: () => void;
  onSelect: () => void;
  onEid: () => void;
  eidLabel: string | null;
  demo: boolean;
  /** Sign-in with a mailed code, when the deployment offers it. */
  email: { slug: string; legalVersion: string; locale: Locale } | null;
  onSignedIn: () => void;
  methodsStatus: "pending" | "error" | "success";
  onRetryMethods: () => void;
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
              <Dialog.Title>{props.t("signInTitle")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text mb="6">
                {props.municipality}. {props.t("signInBody")}
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
              {props.methodsStatus === "pending" && (
                <p role="status" className="muted">
                  {props.t("loading")}
                </p>
              )}
              {props.methodsStatus === "error" && (
                <div role="alert" className="error-text">
                  <p>{props.t("loadError")}</p>
                  <Button
                    mt="2"
                    size="sm"
                    variant="outline"
                    onClick={props.onRetryMethods}
                  >
                    {props.t("retry")}
                  </Button>
                </div>
              )}
              {props.methodsStatus === "success" &&
                (props.eidLabel || props.demo || props.email ? (
                  <div className="login-options">
                    {props.eidLabel && (
                      <>
                        <Button
                          size="lg"
                          colorPalette="court"
                          onClick={props.onEid}
                          disabled={!props.consent || props.pending}
                        >
                          {props.eidLabel}
                        </Button>
                        <p className="muted small">
                          {props.t("signInEidHint")}
                        </p>
                      </>
                    )}
                    {props.demo && (
                      <>
                        <Button
                          size="lg"
                          colorPalette="court"
                          variant={props.eidLabel ? "outline" : "solid"}
                          onClick={props.onSelect}
                          loading={props.pending}
                          disabled={!props.consent}
                        >
                          {props.t("signInDemo")}
                        </Button>
                        <p className="muted small">
                          {props.t("signInDemoHint")}
                        </p>
                      </>
                    )}
                    {props.email && (
                      <EmailSignIn
                        {...props.email}
                        consent={props.consent}
                        t={props.t}
                        onSignedIn={props.onSignedIn}
                      />
                    )}
                    {!props.consent && (
                      <p className="muted small">
                        {props.t("consentRequired")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p role="status" className="muted">
                    {props.t("signInUnavailable")}
                  </p>
                ))}
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
