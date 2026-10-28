// SPDX-License-Identifier: AGPL-3.0-or-later
import { PiArrowSquareOut } from "react-icons/pi";
import logoMark from "@/assets/illustrations/logo-mark.svg";
import { APP_URL, ADMIN_URL, ROUTES } from "@/constants/routes";
import type { copy, Locale } from "@/services/i18n.service";
const LICENSE_URL = "https://www.gnu.org/licenses/agpl-3.0.html";
export function SiteFooter({ t }: { t: (typeof copy)[Locale] }) {
  return (
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
              <a href={ROUTES.accessibility}>{t.footerAccessibility}</a>
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
  );
}
