// SPDX-License-Identifier: AGPL-3.0-or-later
import { Link } from "react-router-dom";
import { Input } from "@chakra-ui/react";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { Pagination } from "@/components/pagination/pagination.view";
import { SportTag } from "@/components/sport-tag/sport-tag.view";
import { ROUTES, routeFor } from "@/constants/routes";
import { localized } from "@/services/catalog.service";
import { fullDateLabel, money } from "@/services/date.service";
import { fill } from "@/services/i18n.service";
import {
  agesLabel,
  enrolmentLabel,
  scheduleLabel,
} from "@/services/activity.service";
import { useActivitiesController } from "./activities.controller";
export function Activities() {
  const c = useActivitiesController();
  const { t, locale } = c;
  return (
    <div className="page catalog-page">
      <header className="page-header">
        <h1>{t("activitiesTitle")}</h1>
        <p className="page-subtitle">
          {c.municipality.name}. {t("activitiesIntro")}
        </p>
      </header>
      <section className="catalog-section" aria-label={t("activities")}>
        <div className="catalog-tools">
          <div className="field age-filter">
            <label htmlFor="activity-age">{t("activityAgeFilter")}</label>
            <Input
              id="activity-age"
              type="number"
              inputMode="numeric"
              min={0}
              max={120}
              defaultValue={c.filters.age ?? ""}
              onChange={(event) => c.setAge(event.target.value)}
            />
          </div>
          <div className="catalog-toggles">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={c.filters.open}
                onChange={c.toggleOpen}
              />
              {t("onlyOpenEnrolment")}
            </label>
          </div>
        </div>
        <div className="filter-row" role="group" aria-label={t("sport")}>
          {[{ code: "", label: t("allSports") }, ...c.sports].map((sport) => (
            <button
              type="button"
              key={sport.code || "all"}
              className={`filter-pill ${c.filters.sport === sport.code ? "selected" : ""}`}
              aria-pressed={c.filters.sport === sport.code}
              onClick={() => c.setSport(sport.code)}
            >
              {sport.label}
            </button>
          ))}
          <span className="result-count" role="status">
            {c.query.data
              ? fill(t(c.total === 1 ? "activityCount" : "activitiesCount"), {
                  count: c.total,
                })
              : null}
          </span>
        </div>
        {c.query.isPending ? (
          <Feedback message={t("loading")} />
        ) : c.query.isError && !c.query.data ? (
          <Feedback
            message={t("loadError")}
            error
            retryLabel={t("retry")}
            retry={() => {
              void c.query.refetch();
            }}
          />
        ) : c.activities.length ? (
          <>
            <ul className="activity-list">
              {c.activities.map((activity) => {
                const general = activity.prices.find(
                  (price) => price.category === "general",
                );
                const ages = agesLabel(activity, t);
                return (
                  <li key={activity.id} className={`sport-${activity.sportArt}`}>
                    <h2>
                      <Link
                        to={routeFor(
                          c.municipality.slug,
                          `${ROUTES.activities}/${activity.id}`,
                        )}
                      >
                        {localized(activity.name, locale)}
                      </Link>
                    </h2>
                    <SportTag
                      sport={activity.sportArt}
                      label={localized(activity.sportName, locale)}
                    />
                    <p>{scheduleLabel(activity, t, locale)}</p>
                    <p className="muted">
                      {activity.facilityName}, {activity.resourceName}
                    </p>
                    <p className="muted">
                      {fill(t("activityPeriod"), {
                        from: fullDateLabel(activity.rule.startsOn, locale),
                        to: fullDateLabel(activity.rule.endsOn, locale),
                      })}
                    </p>
                    <dl className="activity-facts">
                      <div>
                        <dt>{t("activityPlaces")}</dt>
                        <dd>{activity.places}</dd>
                      </div>
                      <div>
                        <dt>{t("activityAges")}</dt>
                        <dd>{ages ?? t("activityAgesAll")}</dd>
                      </div>
                      <div>
                        <dt>{t("enrolment")}</dt>
                        <dd>{t(enrolmentLabel(activity))}</dd>
                      </div>
                      {general && (
                        <div>
                          <dt>{t("activityPrice")}</dt>
                          <dd>{money(general.priceCents, locale)}</dd>
                        </div>
                      )}
                    </dl>
                  </li>
                );
              })}
            </ul>
            <Pagination
              label={t("pagination")}
              page={c.page}
              numbers={c.pageNumbers}
              hrefFor={c.hrefFor}
              previousLabel={t("previousPage")}
              nextLabel={t("nextPage")}
              pageLabel={c.pageLabel}
            />
          </>
        ) : (
          <div className="empty-state">
            <SpotArt kind="search" />
            <h2>{t("noActivities")}</h2>
            <p>{t("tryFilters")}</p>
          </div>
        )}
      </section>
    </div>
  );
}
