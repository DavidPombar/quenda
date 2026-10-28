// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input } from "@chakra-ui/react";
import { Feedback } from "@/components/feedback/feedback.view";
import { dateTimeLabel } from "@/services/date.service";
import type { TextKey } from "@/services/i18n.service";
import type { Locale } from "@/types/models";
import { useAccessQrController } from "./access-qr.controller";
export function AccessQr(p: {
  tenantId: string;
  timezone: string;
  locale: Locale;
  t: (key: TextKey) => string;
}) {
  const c = useAccessQrController(p);
  const { t } = p;
  return (
    <section className="settings-section" aria-labelledby="access-qr-title">
      <h2 id="access-qr-title">{t("accessSettingsTitle")}</h2>
      <p className="field-hint">{t("accessSettingsBody")}</p>
      {c.settings.isPending ? (
        <Feedback message={t("loading")} />
      ) : c.settings.isError ? (
        <Feedback
          message={t("loadError")}
          error
          retryLabel={t("retry")}
          retry={() => {
            void c.settings.refetch();
          }}
        />
      ) : (
        <>
          <p>
            {c.activeKey ? (
              <>
                {t("accessKeyActive")}:{" "}
                <code>{c.activeKey.kid.slice(0, 12)}</code> (
                {dateTimeLabel(c.activeKey.createdAt, p.timezone, p.locale)})
              </>
            ) : (
              t("accessKeyNone")
            )}
          </p>
          {c.confirming ? (
            <div
              role="group"
              aria-labelledby="access-rotate-title"
              className="notice"
            >
              <strong id="access-rotate-title">
                {t("accessRotateConfirm")}
              </strong>
              <p>{t("accessRotateBody")}</p>
              <div className="row-actions">
                <Button
                  colorPalette="court"
                  onClick={c.confirmRotate}
                  loading={c.rotate.isPending}
                >
                  {t("accessRotate")}
                </Button>
                <Button variant="ghost" onClick={c.cancelRotate}>
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              alignSelf="flex-start"
              onClick={c.askRotate}
            >
              {t("accessRotate")}
            </Button>
          )}
          {c.rotate.isSuccess && !c.confirming && (
            <p role="status" className="success-message">
              {t("accessRotated")}
            </p>
          )}
          <h3>{t("accessWebhookTitle")}</h3>
          <p className="field-hint">{t("accessWebhookBody")}</p>
          <form
            noValidate
            onSubmit={(event) => {
              void c.save(event);
            }}
          >
            <Field.Root className="field" invalid={c.invalid}>
              <Field.Label>{t("accessWebhookUrl")}</Field.Label>
              <Input
                type="url"
                inputMode="url"
                value={c.url}
                placeholder="https://"
                onChange={(event) => c.setUrl(event.target.value)}
              />
              <Field.ErrorText>{t("accessWebhookInvalid")}</Field.ErrorText>
            </Field.Root>
            {c.settings.data.hasWebhookSecret && (
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={c.rotateSecret}
                  onChange={(event) => c.setRotateSecret(event.target.checked)}
                />
                {t("accessWebhookRotate")}
              </label>
            )}
            <Button
              type="submit"
              colorPalette="court"
              loading={c.update.isPending}
            >
              {t("accessWebhookSave")}
            </Button>
          </form>
          {c.update.isSuccess && (
            <p role="status" className="success-message">
              {t("accessWebhookSaved")}
            </p>
          )}
          {c.secret && (
            <div className="notice">
              <p>{t("accessWebhookSecret")}</p>
              <code className="access-secret">{c.secret}</code>
            </div>
          )}
          {c.update.isError && (
            <p role="alert" className="error-text">
              {t("accessWebhookError")}
            </p>
          )}
        </>
      )}
    </section>
  );
}
