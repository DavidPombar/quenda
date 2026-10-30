// SPDX-License-Identifier: AGPL-3.0-or-later
import { Link } from "react-router-dom";
import { Button, Input } from "@chakra-ui/react";
import { PiMagnifyingGlass, PiMapPin, PiWheelchair } from "react-icons/pi";
import logoMark from "@/assets/illustrations/logo-mark.svg";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { SportTag } from "@/components/sport-tag/sport-tag.view";
import { WEBSITE_URL } from "@/constants/routes";
import { useHomeController } from "./home.controller";
export function Home() {
  const c = useHomeController();
  const { t } = c;
  return (
    <div className="home-search">
      <a href="#main" className="skip-link">
        {t("skip")}
      </a>
      <header className="home-search-header">
        <a href={WEBSITE_URL} className="brand" aria-label="Quenda">
          <img className="brand-symbol" src={logoMark} alt="" />
          <span>
            quenda<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="locale-switch" role="group" aria-label={t("language")}>
          {(["gl", "es"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={c.locale === value}
              onClick={() => c.setLocale(value)}
            >
              {value.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <main id="main" tabIndex={-1} className="page catalog-page">
        <header className="page-header">
          <h1>{t("homeTitle")}</h1>
          <p className="page-subtitle">{t("homeIntro")}</p>
        </header>
        <form
          className="home-filters"
          aria-label={t("homeFilters")}
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="search-input">
            <PiMagnifyingGlass size={20} aria-hidden="true" />
            <Input
              size="lg"
              type="search"
              aria-label={t("search")}
              placeholder={t("searchPlaceholder")}
              maxLength={80}
              value={c.filters.q}
              onChange={(event) => c.update({ q: event.target.value })}
            />
          </div>
          <div className="filter-row" role="group" aria-label={t("sport")}>
            {[
              { code: "", label: t("allSports") },
              ...c.sports.map((sport) => ({
                code: sport.code,
                label: sport.name[c.locale],
              })),
            ].map(({ code, label }) => (
              <button
                type="button"
                key={code || "all"}
                className={`filter-pill ${c.filters.sport === code ? "selected" : ""}`}
                aria-pressed={c.filters.sport === code}
                onClick={() => c.update({ sport: code })}
              >
                {label}
              </button>
            ))}
          </div>
          {c.municipalities.data && (
            <fieldset className="filter-row municipality-filter">
              <legend>{t("homeMunicipalities")}</legend>
              {c.municipalities.data.map((municipality) => (
                <label key={municipality.id} className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={c.filters.municipalities.includes(
                      municipality.slug,
                    )}
                    onChange={() => c.toggleMunicipality(municipality.slug)}
                  />
                  {municipality.name}
                </label>
              ))}
            </fieldset>
          )}
          <div className="filter-row">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={c.filters.accessible}
                onChange={(event) =>
                  c.update({ accessible: event.target.checked })
                }
              />
              {t("homeAccessible")}
            </label>
            {c.hasFilters && (
              <Button variant="ghost" onClick={c.clear}>
                {t("homeClear")}
              </Button>
            )}
            <span className="result-count" aria-live="polite">
              {c.catalog.isPending ? t("loading") : c.countLabel}
            </span>
          </div>
        </form>
        {c.catalog.isError ? (
          <Feedback
            message={t("loadError")}
            error
            retryLabel={t("retry")}
            retry={() => {
              void c.catalog.refetch();
            }}
          />
        ) : c.catalog.isPending ? (
          <Feedback message={t("loading")} />
        ) : c.catalog.data.length ? (
          <ul className="facility-grid home-results">
            {c.catalog.data.map((facility) => (
              <li key={facility.id}>
                <article
                  className="home-card"
                  aria-labelledby={`facility-${facility.id}`}
                >
                  <SportTag
                    art={facility.sportArt}
                    label={facility.sportName[c.locale]}
                  />
                  <h2 id={`facility-${facility.id}`}>{facility.name}</h2>
                  <p className="home-meta">
                    <PiMapPin size={16} aria-hidden="true" />
                    {facility.address} ·{" "}
                    <Link to={c.catalogUrl(facility.municipality.slug)}>
                      {facility.municipality.name}
                    </Link>
                  </p>
                  {facility.accessible && (
                    <p className="home-meta">
                      <PiWheelchair size={16} aria-hidden="true" />
                      {t("stepFree")}
                    </p>
                  )}
                  <Link
                    className="home-book"
                    to={c.detailUrl(facility.municipality.slug, facility.id)}
                    aria-label={`${t("homeBook")}: ${facility.name}`}
                  >
                    {t("homeBook")}
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <SpotArt kind="search" />
            <h2>{t("noResults")}</h2>
            <p>{t("tryFilters")}</p>
          </div>
        )}
      </main>
    </div>
  );
}
