// SPDX-License-Identifier: AGPL-3.0-or-later
import { StaffSignIn } from "@/components/staff-sign-in/staff-sign-in.view";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@chakra-ui/react";
import {
  PiBuildings,
  PiChartBar,
  PiChartLine,
  PiSignOut,
  PiArrowLeft,
} from "react-icons/pi";
import { ROUTES, operatorRouteFor } from "@/constants/routes";
import logoMark from "@/assets/illustrations/logo-mark.svg";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { useOperatorController } from "./operator.controller";
export function Operator() {
  const c = useOperatorController();
  const { t } = c;
  return (
    <div className="app-shell admin-shell">
      <a href="#main" className="skip-link">
        {t("skip")}
      </a>
      <aside className="sidebar">
        <NavLink
          to={operatorRouteFor(ROUTES.deployment)}
          className="brand"
          aria-label="Quenda"
        >
          <img className="brand-symbol" src={logoMark} alt="" />
          <span>
            quenda<span className="brand-dot">.</span>
          </span>
        </NavLink>
        <p className="brand-tagline">{t("operatorArea")}</p>
        {c.context && (
          <nav aria-label={t("operatorArea")} className="main-nav">
            <NavLink to={operatorRouteFor(ROUTES.deployment)}>
              <PiBuildings size={20} aria-hidden="true" />
              {t("operatorMunicipalities")}
            </NavLink>
            <NavLink to={operatorRouteFor(ROUTES.deploymentInsights)}>
              <PiChartBar size={20} aria-hidden="true" />
              {t("insights")}
            </NavLink>
            <NavLink to={operatorRouteFor(ROUTES.deploymentWebAnalytics)}>
              <PiChartLine size={20} aria-hidden="true" />
              {t("webAnalytics")}
            </NavLink>
          </nav>
        )}
        <div className="sidebar-bottom">
          <ul className="sidebar-links">
            <li>
              <NavLink to={ROUTES.home}>
                <PiArrowLeft size={15} aria-hidden="true" /> {t("management")}
              </NavLink>
            </li>
          </ul>
          <p className="sidebar-note">{t("openSource")}</p>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <p className="topbar-title">{t("operatorArea")}</p>
          <div className="topbar-actions">
            <div
              className="locale-switch"
              role="group"
              aria-label={t("language")}
            >
              {(["gl", "es"] as const).map((locale) => (
                <button
                  key={locale}
                  type="button"
                  aria-pressed={c.locale === locale}
                  onClick={() => c.setLocale(locale)}
                >
                  {locale.toUpperCase()}
                </button>
              ))}
            </div>
            {c.context && (
              <>
                <div className="account">
                  <span className="account-text">
                    <span className="sr-only">{t("signedInAs")} </span>
                    <strong>{c.context.session.displayName}</strong>
                    <span>{t("operatorRole")}</span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="md"
                  px="0"
                  onClick={c.signOut}
                  aria-label={t("signOut")}
                  loading={c.remove.isPending}
                >
                  <PiSignOut size={20} aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {c.session.isPending ? (
            <Feedback message={t("loading")} />
          ) : c.context ? (
            <Outlet context={c.context} />
          ) : (
            <div className="page">
              <div className="empty-state">
                <SpotArt kind="access" />
                <h1>{t("operatorSignInTitle")}</h1>
                <p>{t("operatorSignInBody")}</p>
                {c.local && <StaffSignIn t={t} onSignedIn={() => undefined} />}
                {c.demo && (
                  <Button
                    colorPalette="court"
                    variant={c.local ? "outline" : "solid"}
                    onClick={c.signIn}
                    loading={c.create.isPending}
                  >
                    {t("operatorSignIn")}
                  </Button>
                )}
                {c.create.error && (
                  <p role="alert" className="error-text">
                    {c.create.error.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </main>
        <footer className="footer">
          <span>{t("demo")}</span>
          <span>{t("operatorPrivacy")}</span>
        </footer>
      </div>
    </div>
  );
}
