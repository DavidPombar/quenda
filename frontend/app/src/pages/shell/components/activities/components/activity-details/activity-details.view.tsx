// SPDX-License-Identifier: AGPL-3.0-or-later
import { Link } from "react-router-dom";
import { PiArrowLeft } from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { SportTag } from "@/components/sport-tag/sport-tag.view";
import { ROUTES, routeFor } from "@/constants/routes";
import { localized } from "@/services/catalog.service";
import {
  dateLabel,
  fullDateLabel,
  money,
  timeLabel,
} from "@/services/date.service";
import { fill } from "@/services/i18n.service";
import { categoryLabel } from "@/services/tariff.service";
import {
  agesLabel,
  enrolmentLabel,
  scheduleLabel,
} from "@/services/activity.service";
import { useActivityDetailsController } from "./activity-details.controller";
export function ActivityDetails() {
  const c = useActivityDetailsController();
  const { t, locale } = c;
  if (c.query.isPending) return <Feedback message={t("loading")} />;
  if (!c.activity) return <Feedback message={t("notFound")} error />;
  const a = c.activity;
  const zone = c.municipality.timezone;
  const description = localized(a.description, locale);
  return (
    <div className="page detail-page">
      <Link
        className="back-link"
        to={routeFor(c.municipality.slug, ROUTES.activities)}
      >
        <PiArrowLeft size={20} aria-hidden="true" />
        {t("backToActivities")}
      </Link>
      <header className="detail-heading">
        <h1>{localized(a.name, locale)}</h1>
        <div className="facility-tags">
          <SportTag sport={a.sportArt} label={localized(a.sportName, locale)} />
        </div>
      </header>
      {a.status === "cancelled" && (
        <p className="status-notice" role="status">
          {fill(t("activityCancelledNotice"), {
            reason: a.cancellationReason ?? "",
          })}
        </p>
      )}
      <div className="detail-info activity-details">
        {description && <p>{description}</p>}
        <dl className="activity-facts">
          <div>
            <dt>{t("activitySchedule")}</dt>
            <dd>{scheduleLabel(a, t, locale)}</dd>
          </div>
          <div>
            <dt>{t("activityDates")}</dt>
            <dd>
              {fill(t("activityPeriod"), {
                from: fullDateLabel(a.rule.startsOn, locale),
                to: fullDateLabel(a.rule.endsOn, locale),
              })}
            </dd>
          </div>
          <div>
            <dt>{t("activityPlace")}</dt>
            <dd>
              <Link
                to={routeFor(
                  c.municipality.slug,
                  `${ROUTES.catalog}/${a.facilityId}`,
                )}
              >
                {a.facilityName}
              </Link>
              , {a.resourceName}. {a.facilityAddress}
            </dd>
          </div>
          <div>
            <dt>{t("activityPlaces")}</dt>
            <dd>{a.places}</dd>
          </div>
          <div>
            <dt>{t("activityAges")}</dt>
            <dd>{agesLabel(a, t) ?? t("activityAgesAll")}</dd>
          </div>
          <div>
            <dt>{t("enrolment")}</dt>
            <dd>
              {t(enrolmentLabel(a))}.{" "}
              {fill(t("activityPeriod"), {
                from: fullDateLabel(a.enrolmentOpensOn, locale),
                to: fullDateLabel(a.enrolmentClosesOn, locale),
              })}
            </dd>
          </div>
        </dl>
        {a.prices.length > 0 && (
          <>
            <h2>{t("activityPrices")}</h2>
            <dl className="activity-facts">
              {a.prices.map((price) => (
                <div key={price.category}>
                  <dt>{t(categoryLabel(price.category))}</dt>
                  <dd>{money(price.priceCents, locale)}</dd>
                </div>
              ))}
            </dl>
            <p className="muted small">{t("activityPricesNote")}</p>
          </>
        )}
        {a.status === "published" && a.enrolment !== "closed" && (
          <p>
            {t("activityEnrolHow")}{" "}
            <a href={`mailto:${c.municipality.contact}`}>
              {c.municipality.contact}
            </a>
          </p>
        )}
        <h2>{t("activityUpcomingSessions")}</h2>
        {c.sessions.length === 0 ? (
          <p className="muted">{t("activityNoSessions")}</p>
        ) : (
          <ul className="session-list">
            {c.sessions.map((session) => (
              <li key={session.id}>
                <span>
                  {dateLabel(session.start, zone, locale)},{" "}
                  {timeLabel(session.start, zone)}–{timeLabel(session.end, zone)}
                </span>
                {session.status === "cancelled" && (
                  <span className="session-cancelled">
                    {fill(t("sessionCancelled"), {
                      reason: session.cancellationReason ?? "",
                    })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {c.more > 0 && (
          <p className="muted">{fill(t("moreSessions"), { count: c.more })}</p>
        )}
      </div>
    </div>
  );
}
