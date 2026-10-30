// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input, NativeSelect } from "@chakra-ui/react";
import {
  PiArrowLeft,
  PiMagnifyingGlass,
  PiMapPin,
  PiWheelchair,
} from "react-icons/pi";
import logoMark from "@/assets/illustrations/logo-mark.svg";
import { ROUTES } from "@/constants/routes";
import { useSearchController } from "./search.controller";
/** Facilities across every municipality of the deployment (#18). */
export function Search() {
  const c = useSearchController();
  const { t } = c;
  return (
    <div className="website">
      <a href="#main" className="skip-link">
        {t.skip}
      </a>
      <header className="site-header wrap">
        <a href={ROUTES.home} className="brand" aria-label="Quenda">
          <img className="brand-symbol" src={logoMark} alt="" />
          quenda
        </a>
        <nav aria-label={t.navigation}>
          <a className="section-link" href={ROUTES.home}>
            <PiArrowLeft size={16} aria-hidden="true" /> {t.searchBack}
          </a>
          <div className="locale-switch" role="group" aria-label={t.language}>
            {(["gl", "es"] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={c.locale === value}
                onClick={() => c.selectLocale(value)}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="search-page wrap">
        <div className="section-heading">
          <h1>{t.searchTitle}</h1>
          <p>{t.searchIntro}</p>
        </div>
        <div className="search-layout">
          <form
            className="search-filters"
            aria-label={t.searchFilters}
            onSubmit={(event) => event.preventDefault()}
          >
            <Field.Root>
              <Field.Label>{t.searchText}</Field.Label>
              <div className="search-input">
                <PiMagnifyingGlass size={20} aria-hidden="true" />
                <Input
                  type="search"
                  maxLength={80}
                  value={c.filters.q}
                  onChange={(event) => c.update({ q: event.target.value })}
                />
              </div>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.searchSport}</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={c.filters.sport}
                  onChange={(event) => c.update({ sport: event.target.value })}
                >
                  <option value="">{t.searchAllSports}</option>
                  {c.sports.map((sport) => (
                    <option key={sport.code} value={sport.code}>
                      {sport.label}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={c.filters.accessible}
                onChange={(event) =>
                  c.update({ accessible: event.target.checked })
                }
              />
              {t.searchAccessible}
            </label>
            {c.municipalities.data && (
              <fieldset className="municipality-filter">
                <legend>{t.searchMunicipalities}</legend>
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
            {c.hasFilters && (
              <Button variant="outline" onClick={c.clear}>
                {t.searchClear}
              </Button>
            )}
          </form>
          <section className="search-results" aria-labelledby="results-count">
            <p id="results-count" className="result-count" aria-live="polite">
              {c.catalog.isPending ? t.searchLoading : c.countLabel}
            </p>
            {c.catalog.isError ? (
              <div role="alert" className="search-empty">
                <p>{t.searchError}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    void c.catalog.refetch();
                  }}
                >
                  {t.searchRetry}
                </Button>
              </div>
            ) : c.catalog.data && c.catalog.data.items.length === 0 ? (
              <div className="search-empty">
                <p>
                  <strong>{t.searchEmpty}</strong>
                </p>
                <p>{t.searchEmptyHint}</p>
              </div>
            ) : (
              <ul className="search-list">
                {c.catalog.data?.items.map((facility) => (
                  <li key={facility.id}>
                    <article
                      className="search-card"
                      aria-labelledby={`facility-${facility.id}`}
                    >
                      <p className={`sport-tag sport-${facility.sport}`}>
                        {c.sportLabel(facility.sportName)}
                      </p>
                      <h2 id={`facility-${facility.id}`}>{facility.name}</h2>
                      <p className="search-meta">
                        <PiMapPin size={16} aria-hidden="true" />
                        {facility.address} · {facility.municipality.name}
                      </p>
                      {facility.accessible && (
                        <p className="search-meta">
                          <PiWheelchair size={16} aria-hidden="true" />
                          {t.searchStepFree}
                        </p>
                      )}
                      <a
                        className="text-link"
                        href={c.bookingUrl(
                          facility.municipality.slug,
                          facility.id,
                        )}
                        aria-label={`${t.searchBook}: ${facility.name}`}
                      >
                        {t.searchBook}
                      </a>
                    </article>
                  </li>
                ))}
              </ul>
            )}
            {c.pages > 1 && (
              <nav className="search-pages" aria-label={t.searchPages}>
                {c.previousHref ? (
                  <a href={c.previousHref} rel="prev">
                    {t.searchPrevious}
                  </a>
                ) : null}
                <span aria-current="page">{c.pageLabel}</span>
                {c.nextHref ? (
                  <a href={c.nextHref} rel="next">
                    {t.searchNext}
                  </a>
                ) : null}
              </nav>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
