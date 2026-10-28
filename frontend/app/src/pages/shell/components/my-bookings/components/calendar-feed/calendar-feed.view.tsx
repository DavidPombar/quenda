// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input } from "@chakra-ui/react";
import { PiCalendarPlus, PiCopy } from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { dateLabel } from "@/services/date.service";
import type { Locale } from "@/types/models";
import type { TextKey } from "@/services/i18n.service";
import { useCalendarFeedController } from "./calendar-feed.controller";
export function CalendarFeed(p: {
  userId: string;
  timezone: string;
  locale: Locale;
  t: (key: TextKey) => string;
}) {
  const c = useCalendarFeedController(p.userId);
  return (
    <section className="calendar-feed" aria-labelledby="calendar-feed-title">
      <h2 id="calendar-feed-title">{p.t("calendarFeedTitle")}</h2>
      <p>{p.t("calendarFeedBody")}</p>
      {c.feed.isPending ? (
        <Feedback message={p.t("loading")} />
      ) : c.feed.isError ? (
        <Feedback
          error
          message={p.t("loadError")}
          retryLabel={p.t("retry")}
          retry={() => {
            void c.feed.refetch();
          }}
        />
      ) : (
        <>
          {c.httpsUrl && c.webcalUrl ? (
            <div className="calendar-feed-link">
              <p className="calendar-feed-warning">{p.t("calendarFeedOnce")}</p>
              <Field.Root>
                <Field.Label>{p.t("calendarFeedUrl")}</Field.Label>
                <Input
                  readOnly
                  value={c.httpsUrl}
                  onFocus={(event) => event.currentTarget.select()}
                />
              </Field.Root>
              <div className="booking-actions">
                <Button
                  size="lg"
                  colorPalette="court"
                  onClick={() => {
                    void c.copy();
                  }}
                >
                  <PiCopy size={20} aria-hidden="true" />
                  {p.t("calendarFeedCopy")}
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href={c.webcalUrl}>{p.t("calendarFeedOpen")}</a>
                </Button>
              </div>
              <p role="status" className="muted">
                {c.copied ? p.t("calendarFeedCopied") : ""}
              </p>
            </div>
          ) : c.feed.data?.active && c.feed.data.createdAt ? (
            <p>
              {`${p.t("calendarFeedActive")} ${dateLabel(c.feed.data.createdAt, p.timezone, p.locale)}.`}
            </p>
          ) : null}
          {c.error && (
            <p role="alert" className="error-text">
              {c.error.message}
            </p>
          )}
          {c.active ? (
            <div className="booking-actions">
              {!c.httpsUrl && (
                <Button
                  size="lg"
                  variant="outline"
                  loading={c.busy}
                  onClick={() => {
                    void c.issue();
                  }}
                >
                  {p.t("calendarFeedRotate")}
                </Button>
              )}
              <Button
                size="lg"
                variant="ghost"
                colorPalette="red"
                disabled={c.busy}
                onClick={() => {
                  void c.remove();
                }}
              >
                {p.t("calendarFeedRevoke")}
              </Button>
              {!c.httpsUrl && (
                <p className="muted">{p.t("calendarFeedRotateNote")}</p>
              )}
            </div>
          ) : (
            <Button
              size="lg"
              colorPalette="court"
              loading={c.busy}
              onClick={() => {
                void c.issue();
              }}
            >
              <PiCalendarPlus size={20} aria-hidden="true" />
              {p.t("calendarFeedCreate")}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
