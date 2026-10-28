// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import { PiArrowSquareOut } from "react-icons/pi";
import logoMark from "@/assets/illustrations/logo-mark.svg";
import { APP_URL, ISSUES_URL, ROUTES } from "@/constants/routes";
import { SiteFooter } from "@/components/site-footer/site-footer.view";
import { useAccessibilityController } from "./accessibility.controller";
export function Accessibility() {
  const { t, locale, selectLocale } = useAccessibilityController();
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
            {t.a11yBack}
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
      <main id="main" tabIndex={-1} className="wrap statement">
        <h1>{t.a11yTitle}</h1>
        <p className="statement-intro">{t.a11yIntro}</p>
        <section aria-labelledby="a11y-status">
          <h2 id="a11y-status">{t.a11yStatusTitle}</h2>
          <p>{t.a11yStatus}</p>
        </section>
        <section aria-labelledby="a11y-content">
          <h2 id="a11y-content">{t.a11yContentTitle}</h2>
          <p>{t.a11yContent}</p>
        </section>
        <section aria-labelledby="a11y-prepared">
          <h2 id="a11y-prepared">{t.a11yPreparationTitle}</h2>
          <p>{t.a11yPreparation}</p>
        </section>
        <section aria-labelledby="a11y-contact">
          <h2 id="a11y-contact">{t.a11yContactTitle}</h2>
          <p>{t.a11yContact}</p>
          <p>
            <a className="text-link" href={ISSUES_URL} rel="noreferrer">
              {t.a11yContactLink}
              <PiArrowSquareOut size={16} aria-hidden="true" />
            </a>
          </p>
        </section>
        <section aria-labelledby="a11y-municipal">
          <h2 id="a11y-municipal">{t.a11yMunicipalTitle}</h2>
          <p>{t.a11yMunicipal}</p>
          <p>
            <a className="text-link" href={APP_URL}>
              {t.a11yMunicipalLink}
            </a>
          </p>
        </section>
      </main>
      <SiteFooter t={t} />
    </div>
  );
}
