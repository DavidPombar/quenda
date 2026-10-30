// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Checkbox } from "@chakra-ui/react";
import { Feedback } from "@/components/feedback/feedback.view";
import type { TextKey } from "@/services/i18n.service";
import { useNoticePreferencesController } from "./notice-preferences.controller";
const DEVICE_TEXT = {
  unavailable: "pushUnavailable",
  unsupported: "pushUnsupported",
  ios_home_screen: "pushIos",
  denied: "pushDenied",
  active: "pushActive",
} as const satisfies Record<string, TextKey>;
export function NoticePreferences(p: {
  userId: string;
  email: string | null;
  reminderHours: number;
  t: (key: TextKey) => string;
}) {
  const c = useNoticePreferencesController({
    userId: p.userId,
    hasEmail: !!p.email,
    reminderHours: p.reminderHours,
    t: p.t,
  });
  return (
    <section className="account-section" aria-labelledby="notices-title">
      <h2 id="notices-title">{p.t("noticesTitle")}</h2>
      <p>{p.t("noticesIntro")}</p>
      {p.email ? (
        <dl className="facts">
          <div>
            <dt>{p.t("noticesEmail")}</dt>
            <dd>{p.email}</dd>
          </div>
        </dl>
      ) : (
        <p>{p.t("noticesNoEmail")}</p>
      )}
      {c.settings.isPending ? (
        <Feedback message={p.t("loading")} />
      ) : c.settings.isError ? (
        <Feedback
          message={p.t("loadError")}
          error
          retryLabel={p.t("retry")}
          retry={() => {
            void c.settings.refetch();
          }}
        />
      ) : (
        <form
          className="notice-form"
          onSubmit={(event) => {
            event.preventDefault();
            void c.submit();
          }}
        >
          {c.rows.map((row) => (
            <fieldset key={row.kind} className="notice-row">
              <legend id={`notice-${row.kind}`}>{row.label}</legend>
              {row.hint && <p className="muted small">{row.hint}</p>}
              <div className="notice-channels">
                {(["email", "push"] as const).map((channel) => (
                  <Checkbox.Root
                    key={channel}
                    className="consent-check"
                    colorPalette="court"
                    size="lg"
                    ids={{ label: `notice-${row.kind}-${channel}` }}
                    checked={row[channel]}
                    disabled={
                      c.save.isPending || (channel === "email" && !c.hasEmail)
                    }
                    onCheckedChange={(event) =>
                      c.toggle(row.kind, channel, event.checked === true)
                    }
                  >
                    {/* Read as "<notice> <channel>": the short label alone is ambiguous. */}
                    <Checkbox.HiddenInput
                      aria-labelledby={`notice-${row.kind} notice-${row.kind}-${channel}`}
                    />
                    <Checkbox.Control />
                    <Checkbox.Label>
                      {p.t(
                        channel === "email" ? "channelEmail" : "channelPush",
                      )}
                    </Checkbox.Label>
                  </Checkbox.Root>
                ))}
              </div>
            </fieldset>
          ))}
          <Button
            type="submit"
            colorPalette="court"
            size="lg"
            alignSelf="flex-start"
            loading={c.save.isPending}
          >
            {p.t("noticesSave")}
          </Button>
          {c.save.isSuccess && (
            <p role="status" className="success-body">
              {p.t("noticesSaved")}
            </p>
          )}
          {c.save.isError && (
            <p role="alert" className="error-text">
              {p.t("noticesError")}
            </p>
          )}
        </form>
      )}
      <div className="notice-device" aria-labelledby="push-title">
        <h3 id="push-title">{p.t("pushTitle")}</h3>
        <p className="muted small">{p.t("pushIntro")}</p>
        {c.deviceState === "loading" ? null : c.deviceState === "off" ? (
          <Button
            variant="outline"
            size="lg"
            alignSelf="flex-start"
            loading={c.deviceBusy}
            onClick={c.enable}
          >
            {p.t("pushEnable")}
          </Button>
        ) : (
          <p role={c.deviceState === "active" ? undefined : "note"}>
            {p.t(DEVICE_TEXT[c.deviceState])}
          </p>
        )}
        {c.deviceState === "active" && (
          <Button
            variant="outline"
            size="lg"
            alignSelf="flex-start"
            loading={c.deviceBusy}
            onClick={c.disable}
          >
            {p.t("pushDisable")}
          </Button>
        )}
        {c.deviceError && (
          <p role="alert" className="error-text">
            {p.t("pushError")}
          </p>
        )}
      </div>
    </section>
  );
}
