// SPDX-License-Identifier: AGPL-3.0-or-later
import { Input } from "@chakra-ui/react";
import { PiMagnifyingGlass } from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { Pagination } from "@/components/pagination/pagination.view";
import { FacilityCard } from "./components/facility-card/facility-card.view";
import { useCatalogController } from "./catalog.controller";
export function Catalog() {
  const c = useCatalogController();
  return (
    <div className="page catalog-page">
      <header className="page-header">
        <h1>{c.t("catalogTitle")}</h1>
        <p className="page-subtitle">
          {c.municipality.name}. {c.t("catalogIntro")}
        </p>
      </header>
      <section className="catalog-section" aria-label={c.t("facilities")}>
        <div className="catalog-tools">
          <div className="search-input">
            <PiMagnifyingGlass size={20} aria-hidden="true" />
            <Input
              size="lg"
              type="search"
              aria-label={c.t("search")}
              placeholder={c.t("searchPlaceholder")}
              value={c.search}
              onChange={(event) => c.setSearch(event.target.value)}
            />
          </div>
          <div className="catalog-toggles">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={c.filters.accessible}
                onChange={c.toggleAccessible}
              />
              {c.t("onlyStepFree")}
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={c.filters.hideClosed}
                onChange={c.toggleClosed}
              />
              {c.t("hideClosed")}
            </label>
          </div>
        </div>
        <div className="filter-row" role="group" aria-label={c.t("sport")}>
          {[{ code: "", label: c.t("allSports") }, ...c.sports].map((sport) => (
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
            {c.query.data ? (
              <>
                {c.total} {c.t(c.total === 1 ? "result" : "spaces")}
              </>
            ) : null}
          </span>
        </div>
        {c.query.isPending ? (
          <Feedback message={c.t("loading")} />
        ) : c.query.isError && !c.query.data ? (
          <Feedback
            message={c.t("loadError")}
            error
            retryLabel={c.t("retry")}
            retry={() => {
              void c.query.refetch();
            }}
          />
        ) : c.facilities.length ? (
          <>
            <div className="facility-grid">
              {c.facilities.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  slug={c.municipality.slug}
                  locale={c.locale}
                  t={c.t}
                />
              ))}
            </div>
            <Pagination
              label={c.t("pagination")}
              page={c.page}
              numbers={c.pageNumbers}
              hrefFor={c.hrefFor}
              previousLabel={c.t("previousPage")}
              nextLabel={c.t("nextPage")}
              pageLabel={c.pageLabel}
            />
          </>
        ) : (
          <div className="empty-state">
            <SpotArt kind="search" />
            <h2>{c.t("noResults")}</h2>
            <p>{c.t("tryFilters")}</p>
          </div>
        )}
      </section>
      <section className="booking-rules" aria-labelledby="rules-title">
        <h2 id="rules-title">{c.t("bookingRules")}</h2>
        <dl>
          <div>
            <dt>{c.t("ruleAdvance")}</dt>
            <dd>
              {c.municipality.advanceDays} {c.t("days")}
            </dd>
          </div>
          <div>
            <dt>{c.t("ruleChanges")}</dt>
            <dd>
              {c.t("until")} {c.municipality.cancellationHours}{" "}
              {c.t("hoursBeforeShort")}
            </dd>
          </div>
          <div>
            <dt>{c.t("reservationLimit")}</dt>
            <dd>{c.municipality.maxActiveBookings}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
