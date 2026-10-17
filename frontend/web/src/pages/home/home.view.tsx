// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import { PiArrowSquareOut } from "react-icons/pi";
import heroMap from "@/assets/illustrations/hero-map.svg";
import logoMark from "@/assets/illustrations/logo-mark.svg";
import tennis from "@/assets/illustrations/facility-tennis.svg";
import padel from "@/assets/illustrations/facility-padel.svg";
import swimming from "@/assets/illustrations/facility-swimming.svg";
import { APP_URL, ADMIN_URL } from "@/constants/routes";
import { useHomeController } from "./home.controller";
const STEP_ART = [tennis, padel, swimming];
const LICENSE_URL = "https://www.gnu.org/licenses/agpl-3.0.html";
export function Home() {
  const { t, locale, selectLocale } = useHomeController();
  return (
    <div className="website">
      <a href="#main" className="skip-link">
        {t.skip}
      </a>
      <header className="site-header wrap">
        <a href="/" className="brand" aria-label="Quenda">
          <img className="brand-symbol" src={logoMark} alt="" />
          quenda
        </a>
        <nav aria-label={t.navigation}>
          <a className="section-link" href="#como-funciona">
            {t.how}
          </a>
          <a className="section-link" href="#concellos">
            {t.councils}
          </a>
          <div className="locale-switch" role="group" aria-label={t.language}>
            {(["gl", "es"] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={locale === value}
                onClick={() => selectLocale(value)}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>
          <Button asChild variant="outline" className="header-cta">
            <a href={APP_URL}>{t.enter}</a>
          </Button>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <section className="hero wrap">
          <div className="hero-copy">
            <h1>{t.title}</h1>
            <p className="hero-intro">{t.intro}</p>
            <div className="hero-actions">
              <Button asChild colorPalette="court">
                <a href={APP_URL}>{t.openApp}</a>
              </Button>
              <a className="text-link" href="#como-funciona">
                {t.discover}
              </a>
            </div>
            <p className="demo-note">{t.demo}</p>
          </div>
          <figure className="hero-map">
            <img src={heroMap} alt={t.illustration} draggable={false} />
            <figcaption>
              <ol className="map-legend" aria-label={t.mapLegend}>
                {t.mapPlaces.map((place, index) => (
                  <li
                    key={place.sport}
                    className={`sport-tag sport-${place.sport}`}
                  >
                    <span aria-hidden="true">{index + 1}</span>
                    {place.name}
                  </li>
                ))}
              </ol>
            </figcaption>
          </figure>
        </section>
        <section
          id="como-funciona"
          className="section wrap"
          aria-labelledby="steps-title"
        >
          <div className="section-heading">
            <h2 id="steps-title">{t.stepsTitle}</h2>
            <p>{t.stepsIntro}</p>
          </div>
          <ol className="steps">
            {t.steps.map((step, index) => (
              <li key={step.title}>
                <img
                  className="step-art"
                  src={STEP_ART[index]}
                  alt=""
                  draggable={false}
                />
                <p className="step-number">
                  {t.step} {index + 1}
                </p>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
        <section
          id="concellos"
          className="section council wrap"
          aria-labelledby="council-title"
        >
          <div className="section-heading">
            <h2 id="council-title">{t.councilTitle}</h2>
            <p>{t.councilBody}</p>
            <Button asChild variant="outline">
              <a href={ADMIN_URL}>{t.management}</a>
            </Button>
          </div>
          <dl className="feature-list">
            {t.features.map((feature) => (
              <div key={feature.title}>
                <dt>{feature.title}</dt>
                <dd>{feature.body}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="section open wrap" aria-labelledby="open-title">
          <div className="section-heading">
            <h2 id="open-title">{t.openTitle}</h2>
            <p>{t.openBody}</p>
            <a
              className="text-link"
              href={LICENSE_URL}
              rel="license noreferrer"
            >
              {t.license}
              <PiArrowSquareOut size={18} aria-hidden="true" />
            </a>
          </div>
          <ul className="plain-list">
            {t.openPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="site-footer">
        <div className="wrap footer-grid">
          <div className="footer-brand">
            <a className="brand" href="/" aria-label="Quenda">
              <img className="brand-symbol" src={logoMark} alt="" />
              quenda
            </a>
            <p>{t.footerTagline}</p>
          </div>
          <nav aria-label={t.footerLinks}>
            <ul>
              <li>
                <a href={APP_URL}>{t.footerAppLink}</a>
              </li>
              <li>
                <a href={ADMIN_URL}>{t.footerAdminLink}</a>
              </li>
              <li>
                <a href={LICENSE_URL} rel="license noreferrer">
                  {t.footerLicense}
                  <PiArrowSquareOut size={16} aria-hidden="true" />
                </a>
              </li>
            </ul>
          </nav>
          <div className="footer-legal">
            <p>{t.footerPrivacy}</p>
            <p>{t.footerContest}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
