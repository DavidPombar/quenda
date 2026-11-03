// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, NativeSelect } from "@chakra-ui/react";
import { PiDownloadSimple } from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { ReasonDialog } from "@/components/reason-dialog/reason-dialog.view";
import { dateTimeLabel } from "@/services/date.service";
import { enrolmentsCsvUrl } from "@/services/enrolment.service";
import { fill, type TextKey } from "@/services/i18n.service";
import type { Locale, ManagedActivity } from "@/types/models";
import { useActivityEnrolmentsController } from "./activity-enrolments.controller";
export function ActivityEnrolments(p: {
  activity: ManagedActivity;
  timezone: string;
  locale: Locale;
  t: (key: TextKey) => string;
}) {
  const c = useActivityEnrolmentsController(p);
  const { t } = p;
  const name = p.activity.name[p.locale] || p.activity.name.gl;
  const data = c.enrolments.data;
  return (
    <section
      className="settings-section"
      aria-labelledby="activity-enrolments-title"
    >
      <div className="section-heading-row">
        <h2 id="activity-enrolments-title">
          {t("activityEnrolments")}: {name}
        </h2>
        <Button asChild variant="outline" size="sm">
          <a href={enrolmentsCsvUrl(p.activity.id, p.locale)} download>
            <PiDownloadSimple size={18} aria-hidden="true" />
            {t("activityEnrolmentsCsv")}
          </a>
        </Button>
      </div>
      <p>
        {fill(t("activityEnrolmentsSummary"), {
          enrolled: p.activity.enrolled,
          places: p.activity.places,
          waiting: p.activity.waiting,
        })}
      </p>
      <div className="field enrolment-filter">
        <label htmlFor="enrolment-status">{t("activityEnrolmentsShow")}</label>
        <NativeSelect.Root>
          <NativeSelect.Field
            id="enrolment-status"
            value={c.status ?? ""}
            onChange={(event) =>
              c.setStatus(
                event.target.value === "enrolled" ||
                  event.target.value === "waiting"
                  ? event.target.value
                  : null,
              )
            }
          >
            <option value="">{t("activityEnrolmentsAll")}</option>
            <option value="enrolled">{t("activityEnrolmentsEnrolled")}</option>
            <option value="waiting">{t("activityEnrolmentsWaiting")}</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </div>
      {c.enrolments.isPending ? (
        <Feedback message={t("loading")} />
      ) : c.enrolments.isError || !data ? (
        <Feedback
          message={t("loadError")}
          error
          retryLabel={t("retry")}
          retry={() => {
            void c.enrolments.refetch();
          }}
        />
      ) : data.items.length === 0 ? (
        <p className="muted">{t("activityEnrolmentsEmpty")}</p>
      ) : (
        <ul className="session-list enrolment-list">
          {data.items.map((enrolment) => (
            <li key={enrolment.id}>
              <span>
                <strong>{enrolment.name}</strong>
                {enrolment.email && (
                  <>
                    {" "}
                    <span className="muted">{enrolment.email}</span>
                  </>
                )}
                <br />
                <span className="muted">
                  {enrolment.status === "waiting"
                    ? fill(t("activityEnrolmentPosition"), {
                        position: enrolment.position ?? "",
                      })
                    : t("activityEnrolmentHolds")}
                  {". "}
                  {fill(t("activityEnrolmentSince"), {
                    when: dateTimeLabel(
                      enrolment.createdAt,
                      p.timezone,
                      p.locale,
                    ),
                  })}
                </span>
              </span>
              <Button
                size="sm"
                variant="outline"
                aria-label={`${t("activityEnrolmentRemove")}: ${enrolment.name}`}
                onClick={() => c.open(enrolment)}
              >
                {t("activityEnrolmentRemove")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {c.pages > 1 && (
        <nav className="row-actions" aria-label={t("activityEnrolmentsPages")}>
          <Button
            size="sm"
            variant="outline"
            disabled={c.page === 1}
            onClick={c.previous}
          >
            {t("previousPage")}
          </Button>
          <span aria-live="polite">
            {fill(t("pageOf"), { page: c.page, pages: c.pages })}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={c.page === c.pages}
            onClick={c.next}
          >
            {t("nextPage")}
          </Button>
        </nav>
      )}
      {c.removing && (
        <ReasonDialog
          title={t("activityEnrolmentRemoveTitle")}
          description={`${c.removing.name}. ${t("activityEnrolmentRemoveBody")}`}
          t={t}
          pending={c.remove.isPending}
          error={c.remove.error ? c.remove.error.message : null}
          onConfirm={(reason) => {
            void c.confirm(reason);
          }}
          onClose={c.close}
        />
      )}
    </section>
  );
}
