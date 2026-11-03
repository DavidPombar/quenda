// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import { Feedback } from "@/components/feedback/feedback.view";
import { instantDayLabel, timeLabel } from "@/services/date.service";
import { fill, type TextKey } from "@/services/i18n.service";
import type { ActivitySession, Locale, ManagedActivity } from "@/types/models";
import { ReasonDialog } from "@/components/reason-dialog/reason-dialog.view";
import { useActivitySessionsController } from "./activity-sessions.controller";
export function ActivitySessions(p: {
  activity: ManagedActivity;
  timezone: string;
  locale: Locale;
  t: (key: TextKey) => string;
}) {
  const c = useActivitySessionsController(p);
  const { t } = p;
  const name = p.activity.name[p.locale] || p.activity.name.gl;
  const when = (session: ActivitySession) =>
    `${instantDayLabel(session.start, p.timezone, p.locale)}, ${timeLabel(session.start, p.timezone)}–${timeLabel(session.end, p.timezone)}`;
  return (
    <section
      className="settings-section"
      aria-labelledby="activity-sessions-title"
    >
      <h2 id="activity-sessions-title">
        {t("activitySessions")}: {name}
      </h2>
      {p.activity.status === "cancelled" && (
        <p>
          {fill(t("activitySessionCancelled"), {
            reason: p.activity.cancellationReason ?? "",
          })}
        </p>
      )}
      {c.details.isPending ? (
        <Feedback message={t("loading")} />
      ) : c.details.isError ? (
        <Feedback
          message={t("loadError")}
          error
          retryLabel={t("retry")}
          retry={() => {
            void c.details.refetch();
          }}
        />
      ) : c.sessions.length === 0 ? (
        <p className="muted">{t("activitySessionsEmpty")}</p>
      ) : (
        <ul className="session-list">
          {c.sessions.map((session) => (
            <li key={session.id}>
              <span>
                {when(session)}
                {session.status === "cancelled" && (
                  <>
                    {" "}
                    <span className="muted">
                      {fill(t("activitySessionCancelled"), {
                        reason: session.cancellationReason ?? "",
                      })}
                    </span>
                  </>
                )}
              </span>
              {session.status === "active" &&
                p.activity.status === "published" &&
                !c.started(session) && (
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`${t("activitySessionCancel")}: ${when(session)}`}
                    onClick={() => c.openSession(session)}
                  >
                    {t("activitySessionCancel")}
                  </Button>
                )}
            </li>
          ))}
        </ul>
      )}
      {c.hidden > 0 && (
        <Button size="sm" variant="ghost" onClick={c.showAll}>
          {fill(t("activityUpcoming"), { count: c.hidden })}
        </Button>
      )}
      {p.activity.status === "published" && (
        <div className="row-actions">
          <Button variant="ghost" colorPalette="red" onClick={c.openActivity}>
            {t("activityWithdraw")}
          </Button>
        </div>
      )}
      {c.dialog && (
        <ReasonDialog
          title={t(
            c.dialog.kind === "activity"
              ? "activityWithdrawTitle"
              : "activitySessionCancelTitle",
          )}
          description={
            c.dialog.kind === "activity"
              ? `${name}. ${t("activityWithdrawBody")}`
              : `${name}: ${when(c.dialog.session)}`
          }
          t={t}
          pending={c.pending}
          error={c.failed ? t("activityCancelError") : null}
          onConfirm={(reason) => {
            void c.confirm(reason);
          }}
          onClose={c.close}
        />
      )}
    </section>
  );
}
