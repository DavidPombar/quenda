// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Dialog, Field, Input, Portal } from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import type { TextKey } from "@/services/i18n.service";
import type { Locale } from "@/types/models";
import { useAccessControlController } from "./access-control.controller";
export function AccessControl(p: {
  tenantId: string;
  timezone: string;
  locale: Locale;
  t: (key: TextKey) => string;
}) {
  const c = useAccessControlController(p);
  const { t } = p;
  return (
    <section className="settings-section" aria-labelledby="access-title">
      <h2 id="access-title">{t("accessSection")}</h2>
      <p className="field-hint">{t("accessSectionHint")}</p>
      {c.settings.isError ? (
        <Feedback
          message={t("loadError")}
          error
          retryLabel={t("retry")}
          retry={() => {
            void c.settings.refetch();
          }}
        />
      ) : !c.settings.data ? (
        <Feedback message={t("loading")} />
      ) : (
        <>
          <dl className="key-details">
            <dt>{t("accessKeyFingerprint")}</dt>
            <dd>
              <code>{c.settings.data.key.fingerprint}</code>
            </dd>
            <dt>{t("accessKeyCreated")}</dt>
            <dd>{c.keyCreated}</dd>
          </dl>
          <div className="settings-actions">
            <Button variant="outline" onClick={() => c.setConfirming(true)}>
              {t("accessRotateKey")}
            </Button>
            {c.rotated && (
              <p role="status" className="success-message">
                {t("accessKeyRotated")}
              </p>
            )}
          </div>
          <form
            noValidate
            onSubmit={(event) => {
              void c.saveWebhook(event);
            }}
          >
            <Field.Root className="field" invalid={!!c.configure.error}>
              <Field.Label>{t("accessWebhookUrl")}</Field.Label>
              <Input
                type="url"
                inputMode="url"
                placeholder="https://"
                value={c.url}
                onChange={(event) => c.setUrl(event.target.value)}
              />
              <Field.HelperText>{t("accessWebhookHint")}</Field.HelperText>
              {c.configure.error && (
                <Field.ErrorText>{c.configure.error.message}</Field.ErrorText>
              )}
            </Field.Root>
            <div className="settings-actions">
              <Button
                type="submit"
                colorPalette="court"
                loading={c.configure.isPending}
              >
                {t("save")}
              </Button>
              {c.settings.data.webhookUrl && (
                <Button
                  variant="outline"
                  disabled={c.configure.isPending}
                  onClick={(event) => {
                    void c.saveWebhook(event, true);
                  }}
                >
                  {t("accessNewSecret")}
                </Button>
              )}
              {c.saved && (
                <p role="status" className="success-message">
                  {t("settingsSaved")}
                </p>
              )}
            </div>
          </form>
          {c.secret && (
            <div className="secret-once" role="note">
              <p>{t("accessSecretOnce")}</p>
              <code>{c.secret}</code>
            </div>
          )}
        </>
      )}
      <Dialog.Root
        open={c.confirming}
        role="alertdialog"
        onOpenChange={(event) => {
          if (!event.open && !c.rotate.isPending) c.setConfirming(false);
        }}
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content className="modal">
              <Dialog.Header>
                <Dialog.Title>{t("accessRotateTitle")}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <p>{t("accessRotateBody")}</p>
                {c.rotate.error && (
                  <p role="alert" className="error-text">
                    {c.rotate.error.message}
                  </p>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => c.setConfirming(false)}
                  disabled={c.rotate.isPending}
                >
                  {t("cancel")}
                </Button>
                <Button
                  colorPalette="red"
                  loading={c.rotate.isPending}
                  onClick={() => {
                    void c.rotateKey();
                  }}
                >
                  {t("accessRotateConfirm")}
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button
                  variant="ghost"
                  size="md"
                  px="0"
                  aria-label={t("close")}
                  disabled={c.rotate.isPending}
                >
                  <PiX size={20} aria-hidden="true" />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </section>
  );
}
