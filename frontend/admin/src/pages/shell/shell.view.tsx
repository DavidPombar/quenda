// SPDX-License-Identifier: AGPL-3.0-or-later
import { Outlet, NavLink } from "react-router-dom";
import { NativeSelect, Button, Dialog, Portal } from "@chakra-ui/react";
import {
  PiArrowSquareOut,
  PiBuildings,
  PiChartBar,
  PiGearSix,
  PiListChecks,
  PiSignOut,
  PiX,
} from "react-icons/pi";
import {
  ROUTES,
  routeFor,
  WEBSITE_URL,
  CITIZEN_APP_URL,
} from "@/constants/routes";
import logoMark from "@/assets/illustrations/logo-mark.svg";
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
  return (
    <div className="app-shell admin-shell">
      <a href="#main" className="skip-link">
        {t("skip")}
      </a>
      <aside className="sidebar">
        <NavLink
          to={routeFor(municipality.slug, ROUTES.management)}
          className="brand"
          aria-label="Quenda"
        >
          <img className="brand-symbol" src={logoMark} alt="" />
          <span>
            quenda<span className="brand-dot">.</span>
          </span>
        </NavLink>
        <p className="brand-tagline">{t("management")}</p>
        {municipality.logoUrl && (
          <img
            className="municipal-logo"
            src={municipality.logoUrl}
            alt={`${t("logoAlt")}: ${municipality.name}`}
          />
        )}
        <nav aria-label={t("municipalArea")} className="main-nav">
          <NavLink to={routeFor(municipality.slug, ROUTES.management)}>
            <PiBuildings size={20} aria-hidden="true" />
            {t("dashboard")}
          </NavLink>
          {c.session && (
            <NavLink to={routeFor(municipality.slug, ROUTES.insights)}>
              <PiChartBar size={20} aria-hidden="true" />
              {t("insights")}
            </NavLink>
          )}
          {c.session && (
            <NavLink to={routeFor(municipality.slug, ROUTES.audit)}>
              <PiListChecks size={20} aria-hidden="true" />
              {t("audit")}
            </NavLink>
          )}
          {c.session && (
            <NavLink to={routeFor(municipality.slug, ROUTES.settings)}>
              <PiGearSix size={20} aria-hidden="true" />
              {t("settings")}
            </NavLink>
          )}
        </nav>
        <div className="sidebar-bottom">
          <p className="sidebar-contact">
            {t("help")}:{" "}
            <a href={`mailto:${municipality.contact}`}>
              {municipality.contact}
              <PiArrowSquareOut size={15} aria-hidden="true" />
            </a>
          </p>
          <ul className="sidebar-links">
            <li>
              <a href={WEBSITE_URL}>{t("website")}</a>
            </li>
            <li>
              <a href={CITIZEN_APP_URL}>{t("citizenApp")}</a>
            </li>
            <li>
              <button type="button" onClick={() => c.setPrivacyOpen(true)}>
                {t("privacy")}
              </button>
            </li>
          </ul>
          <p className="sidebar-note">{t("openSource")}</p>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <label className="municipality-select">
            <span className="sr-only">{t("municipality")}</span>
            <NativeSelect.Root
              size="md"
              variant="plain"
              width="auto"
              maxWidth={{ base: "100%", md: "320px" }}
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
                  key={locale}
                  type="button"
                  aria-pressed={c.locale === locale}
                  onClick={() => c.setLocale(locale)}
                >
                  {locale.toUpperCase()}
                </button>
              ))}
            </div>
            {c.session ? (
              <>
                <div className="account">
                  <span className="account-avatar" aria-hidden="true">
                    {c.accountInitials}
                  </span>
                  <span className="account-text">
                    <span className="sr-only">{t("signedInAs")} </span>
                    <strong>{c.accountName}</strong>
                    <span>{t("managerRole")}</span>
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
          <Outlet context={c.context} />
        </main>
        <footer className="footer">
          <span>{t("demo")}</span>
          <span>{t("demoNotice")}</span>
        </footer>
      </div>
      <SessionDialog
        open={c.loginOpen}
        onClose={() => c.setLoginOpen(false)}
        onSelect={() => {
          void c.signIn();
        }}
        pending={c.create.isPending}
        error={c.create.error?.message ?? ""}
        t={t}
        municipality={municipality.name}
      />
      <Dialog.Root
        open={c.privacyOpen}
        onOpenChange={(event) => c.setPrivacyOpen(event.open)}
        placement="center"
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
                <Button
                  variant="ghost"
                  size="md"
                  px="0"
                  aria-label={t("close")}
                >
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
