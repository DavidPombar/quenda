// SPDX-License-Identifier: AGPL-3.0-or-later
import { Link } from "react-router-dom";
import { PiClock, PiMapPin, PiWheelchair } from "react-icons/pi";
import { CourtArt } from "@/components/court-art/court-art.view";
import { SportTag } from "@/components/sport-tag/sport-tag.view";
import { FacilityStatus } from "@/components/facility-status/facility-status.view";
import { money } from "@/services/date.service";
import { localized } from "@/services/catalog.service";
import { ROUTES, routeFor } from "@/constants/routes";
import type { Facility, Locale } from "@/types/models";
import type { TextKey } from "@/services/i18n.service";
export function FacilityCard({
  facility,
  slug,
  locale,
  t,
}: {
  facility: Facility;
  slug: string;
  locale: Locale;
  t: (key: TextKey) => string;
}) {
  return (
    <article
      className={`facility-card sport-${facility.sportArt} facility-${facility.status}`}
    >
      <div className="facility-cover">
        {facility.photos[0] ? (
          <img
            className="facility-photo"
            src={facility.photos[0].url}
            alt={localized(facility.photos[0].alt, locale)}
            loading="lazy"
          />
        ) : (
          <CourtArt sport={facility.sportArt} status={facility.status} />
        )}
      </div>
      <div className="facility-content">
        <div className="facility-tags">
          <SportTag
            sport={facility.sportArt}
            label={localized(facility.sportName, locale)}
          />
          <FacilityStatus
            status={facility.status}
            label={t(
              facility.status === "active" ? "available" : facility.status,
            )}
          />
        </div>
        <h2>
          <Link
            className="card-link"
            to={routeFor(slug, `${ROUTES.catalog}/${facility.id}`)}
          >
            {facility.name}
          </Link>
        </h2>
        <ul className="meta-list">
          <li>
            <PiMapPin size={20} aria-hidden="true" />
            {facility.address}
          </li>
          <li>
            <PiClock size={20} aria-hidden="true" />
            {facility.slotMinutes} {t("minutes")}
          </li>
          {facility.accessible && (
            <li>
              <PiWheelchair size={20} aria-hidden="true" />
              {t("stepFree")}
            </li>
          )}
        </ul>
        <div className="facility-card-footer">
          <span className="price">
            {facility.priceCents
              ? money(facility.priceCents, locale)
              : t("free")}
            <small>{t("perSlot")}</small>
          </span>
          <span className="text-link" aria-hidden="true">
            {t("viewTimes")}
          </span>
        </div>
      </div>
    </article>
  );
}
