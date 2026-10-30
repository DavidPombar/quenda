// SPDX-License-Identifier: AGPL-3.0-or-later
import { Outlet, NavLink, Link } from "react-router-dom";
import { NativeSelect, Button, Dialog, Portal } from "@chakra-ui/react";
import {
  PiArrowSquareOut,
  PiCalendarBlank,
  PiCalendarBlankFill,
  PiMapPin,
  PiSignOut,
  PiSquaresFour,
  PiSquaresFourFill,
  PiUserCircle,
  PiUserCircleFill,
  PiX,
} from "react-icons/pi";
import logoMark from "@/assets/illustrations/logo-mark.svg";
import { ROUTES, routeFor, WEBSITE_URL } from "@/constants/routes";
import { Feedback } from "@/components/feedback/feedback.view";
import { SessionDialog } from "@/components/session-dialog/session-dialog.view";
import { useShellController } from "./shell.controller";
export function Shell() {
  const c = useShellController();
  if (c.municipalities.isPending) return <Feedback message={c.t("loading")} />;
  if (!c.municipality || !c.context)
    return (
      <Feedback
        message={c.t("loadError")}
        error
        retryLabel={c.t("retry")}
        retry={() => {
          void c.municipalities.refetch();
        }}
      />
    );
  const { municipality, t } = c;
  const help = (
    <>
      <p className="help-contact">
        {t("support")}
        <a href={`mailto:${municipality.contact}`}>
          {municipality.contact}
          <PiArrowSquareOut size={16} aria-hidden="true" />
        </a>
      </p>
      <div className="help-links">
        <a className="help-link" href={WEBSITE_URL}>
          {t("website")}
        </a>
        <button
          type="button"
          className="help-link"
          onClick={() => c.setPrivacyOpen(true)}
        >
          {t("privacy")}
        </button>
        <NavLink
          className="help-link"
          to={routeFor(municipality.slug, ROUTES.accessibility)}
        >
          {t("accessibility")}
        </NavLink>
        <Link
          className="help-link"
          to={routeFor(municipality.slug, ROUTES.openData)}
        >
          {t("openData")}
        </Link>
      </div>
      <span className="help-note">{t("openSource")}</span>
    </>
  );
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        {t("skip")}
      </a>
      <aside className="sidebar">
        <NavLink
          to={routeFor(municipality.slug, ROUTES.catalog)}
          className="brand"
          aria-label="Quenda"
        >
          <img className="brand-symbol" src={logoMark} alt="" />
          <span>
            quenda<span className="brand-dot">.</span>
          </span>
        </NavLink>
        {municipality.logoUrl && (
          <img
            className="municipal-logo"
            src={municipality.logoUrl}
            alt={`${t("logoAlt")}: ${municipality.name}`}
          />
        )}
        <nav aria-label={t("explore")} className="main-nav">
          <NavLink to={routeFor(municipality.slug, ROUTES.catalog)}>
            {({ isActive }) => (
              <>
                {isActive ? (
                  <PiSquaresFourFill size={22} aria-hidden="true" />
                ) : (
                  <PiSquaresFour size={22} aria-hidden="true" />
                )}
                {t("facilities")}
              </>
            )}
          </NavLink>
          <NavLink to={routeFor(municipality.slug, ROUTES.bookings)}>
            {({ isActive }) => (
              <>
                {isActive ? (
                  <PiCalendarBlankFill size={22} aria-hidden="true" />
                ) : (
                  <PiCalendarBlank size={22} aria-hidden="true" />
                )}
                {t("bookings")}
              </>
            )}
          </NavLink>
          {c.session && (
            <NavLink to={routeFor(municipality.slug, ROUTES.account)}>
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <PiUserCircleFill size={22} aria-hidden="true" />
                  ) : (
                    <PiUserCircle size={22} aria-hidden="true" />
                  )}
                  {t("account")}
                </>
              )}
            </NavLink>
          )}
        </nav>
        <div className="sidebar-bottom">{help}</div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <NavLink
            to={routeFor(municipality.slug, ROUTES.catalog)}
            className="brand topbar-brand"
            aria-label="Quenda"
          >
            <img className="brand-symbol" src={logoMark} alt="" />
            <span className="brand-word" aria-hidden="true">
              quenda<span className="brand-dot">.</span>
            </span>
          </NavLink>
          <label className="municipality-select">
            <PiMapPin size={20} aria-hidden="true" />
            <span className="sr-only">{t("municipality")}</span>
            <NativeSelect.Root
              size="md"
              variant="plain"
              width="auto"
              maxWidth="100%"
            >
              <NativeSelect.Field
                aria-label={t("municipality")}
                value={municipality.slug}
                onChange={(event) => {
                  void c.selectMunicipality(event.target.value);
                }}
              >
                {c.municipalities.data?.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </label>
          <div className="topbar-actions">
            <div
              className="locale-switch"
              role="group"
              aria-label={t("language")}
            >
              {(["gl", "es"] as const).map((locale) => (
                <button
                  type="button"
                  key={locale}
                  lang={locale}
                  aria-pressed={c.locale === locale}
                  onClick={() => c.setLocale(locale)}
                >
                  {locale.toUpperCase()}
                </button>
              ))}
            </div>
            {c.session ? (
              <>
                <NavLink
                  className="account"
                  to={routeFor(municipality.slug, ROUTES.account)}
                >
                  <span className="account-avatar" aria-hidden="true">
                    {c.initials}
                  </span>
                  <span className="account-name">
                    <strong>{c.accountName}</strong>
                    {c.accountRole && <small>{c.accountRole}</small>}
                  </span>
                </NavLink>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={c.signOut}
                  aria-label={t("signOut")}
                  loading={c.remove.isPending}
                >
                  <PiSignOut size={20} aria-hidden="true" />
                </Button>
              </>
            ) : (
              <Button
                colorPalette="court"
                size="md"
                onClick={() => c.setLoginOpen(true)}
              >
                {t("signIn")}
              </Button>
            )}
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {!c.online && (
            <p role="status" className="offline-banner">
              {t("offline")}
            </p>
          )}
          {c.notice && (
            <p role="status" className="page-notice">
              {t(c.notice)}
            </p>
          )}
          {c.authErrorMessage && (
            <div role="alert" className="page-alert">
              <p>{c.authErrorMessage}</p>
              <div className="page-alert-actions">
                <Button size="sm" colorPalette="court" onClick={c.retryAuth}>
                  {t("retry")}
                </Button>
                <Button size="sm" variant="ghost" onClick={c.dismissAuthError}>
                  {t("dismiss")}
                </Button>
              </div>
            </div>
          )}
          <Outlet context={c.context} />
        </main>
        <footer className="footer">
          <div className="footer-help">{help}</div>
          <p>{t("demo")}</p>
        </footer>
      </div>
      <SessionDialog
        open={c.loginOpen}
        onClose={c.closeLogin}
        onSelect={() => {
          void c.signIn();
        }}
        onEid={c.signInWithEid}
        eidLabel={c.eidButtonLabel}
        demo={c.authMethods.data?.demo ?? false}
        methodsStatus={c.authMethods.status}
        onRetryMethods={() => {
          void c.authMethods.refetch();
        }}
        pending={c.create.isPending}
        error={c.create.error?.message ?? ""}
        t={t}
        municipality={municipality.name}
        consent={c.consent}
        onConsentChange={c.setConsent}
        onPrivacy={() => c.setPrivacyOpen(true)}
      />
      <Dialog.Root
        open={c.privacyOpen}
        onOpenChange={(event) => c.setPrivacyOpen(event.open)}
        placement="center"
        scrollBehavior="inside"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content className="modal">
              <Dialog.Header>
                <Dialog.Title>{t("privacyTitle")}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <p lang={c.locale}>{municipality.legalTexts[c.locale]}</p>
                <p className="muted">{municipality.contact}</p>
              </Dialog.Body>
              <Dialog.CloseTrigger asChild>
                <Button variant="ghost" size="md" aria-label={t("close")}>
                  <PiX size={20} aria-hidden="true" />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </div>
  );
}
