// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import { PiPlus } from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { dateTimeLabel, fullDateLabel } from "@/services/date.service";
import { fill, type TextKey } from "@/services/i18n.service";
import type { ManagedActivity } from "@/types/models";
import { ActivityEditor } from "./components/activity-editor/activity-editor.view";
import { ActivitySessions } from "./components/activity-sessions/activity-sessions.view";
import { useActivitiesController } from "./activities.controller";
const STATUS: Record<ManagedActivity["status"], TextKey> = {
  draft: "activityStatusDraft",
  published: "activityStatusPublished",
  cancelled: "activityStatusCancelled",
};
const dayKey = (day: number) => `weekday${day}` as TextKey;
export function Activities() {
  const c = useActivitiesController();
  const { t, locale } = c;
  const failed = c.activities.isError || c.facilities.isError;
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>{t("activities")}</h1>
          <p className="page-subtitle">{t("activitiesSubtitle")}</p>
        </div>
        {c.isManager && (
          <Button colorPalette="court" onClick={() => c.open("nova")}>
            <PiPlus size={18} aria-hidden="true" />
            {t("activityNew")}
          </Button>
        )}
      </div>
      {!c.isManager ? (
        <div className="empty-state">
          <SpotArt kind="access" />
          <h2>{t("managerOnly")}</h2>
          <p>{t("managerPrompt")}</p>
          <Button colorPalette="court" onClick={c.signIn}>
            {t("signIn")}
          </Button>
        </div>
      ) : failed ? (
        <Feedback
          message={t("loadError")}
          error
          retryLabel={t("retry")}
          retry={() => {
            void c.activities.refetch();
            void c.facilities.refetch();
          }}
        />
      ) : !c.activities.data || !c.facilities.data ? (
        <Feedback message={t("loading")} />
      ) : (
        <div className="settings-sections">
          {c.activities.data.length === 0 ? (
            <p className="muted">{t("activitiesEmpty")}</p>
          ) : (
            <ul className="season-list" aria-label={t("activities")}>
              {c.activities.data.map((activity) => (
                <li key={activity.id} className="season-card activity-card">
                  <strong>{activity.name[locale] || activity.name.gl}</strong>
                  <span>{t(STATUS[activity.status])}</span>
                  <span className="muted">
                    {activity.facilityName}, {activity.resourceName}
                  </span>
                  <span className="muted">
                    {activity.rule.weekdays
                      .map((day) => t(dayKey(day)))
                      .join(", ")}{" "}
                    {activity.rule.startsLocal}–{activity.rule.endsLocal}
                  </span>
                  <span className="muted">
                    {fill(t("activityPeriod"), {
                      from: fullDateLabel(activity.rule.startsOn, locale),
                      to: fullDateLabel(activity.rule.endsOn, locale),
                    })}
                  </span>
                  <span className="muted">
                    {fill(t("activityPlacesCount"), {
                      places: activity.places,
                    })}
                  </span>
                  {activity.nextSession && (
                    <span className="muted">
                      {fill(t("activityNext"), {
                        when: dateTimeLabel(
                          activity.nextSession,
                          c.municipality.timezone,
                          locale,
                        ),
                      })}
                    </span>
                  )}
                  <div className="row-actions">
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`${t("activityEdit")}: ${activity.name[locale] || activity.name.gl}`}
                      onClick={() => c.open(activity.id)}
                    >
                      {t("activityEdit")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {c.editing && (c.editing === "nova" || c.selected) && (
            <ActivityEditor
              key={c.selected?.id ?? "nova"}
              activity={c.selected}
              facilities={c.facilities.data}
              sports={c.sports}
              municipality={c.municipality}
              locale={locale}
              t={t}
              saved={!!c.selected && c.created === c.selected.id}
              onSaved={c.saved}
              onClose={c.close}
            />
          )}
          {c.selected && c.selected.status !== "draft" && (
            <ActivitySessions
              activity={c.selected}
              timezone={c.municipality.timezone}
              locale={locale}
              t={t}
            />
          )}
        </div>
      )}
    </div>
  );
}
