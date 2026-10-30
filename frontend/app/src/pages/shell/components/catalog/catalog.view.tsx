// SPDX-License-Identifier: AGPL-3.0-or-later
import { Input } from "@chakra-ui/react";
import { PiMagnifyingGlass } from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
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
              onChange={(event) => c.setFilter("q", event.target.value)}
            />
          </div>
        </div>
        <div className="filter-row" role="group" aria-label={c.t("sport")}>
          {[
            { code: "all", label: c.t("allSports") },
            ...c.sports.map((sport) => ({
              code: sport.code,
              label: sport.name[c.locale],
            })),
          ].map(({ code, label }) => (
            <button
              type="button"
              key={code}
              className={`filter-pill ${c.sport === code ? "selected" : ""}`}
              aria-pressed={c.sport === code}
              onClick={() => c.setFilter("sport", code)}
            >
              {label}
            </button>
          ))}
          <span className="result-count" aria-live="polite">
            {c.facilities.length}{" "}
            {c.t(c.facilities.length === 1 ? "result" : "spaces")}
          </span>
        </div>
        {c.query.isPending ? (
          <Feedback message={c.t("loading")} />
        ) : c.query.isError ? (
          <Feedback
            message={c.t("loadError")}
            error
            retryLabel={c.t("retry")}
            retry={() => {
              void c.query.refetch();
            }}
          />
        ) : c.facilities.length ? (
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
