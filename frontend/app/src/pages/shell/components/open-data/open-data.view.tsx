// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  PiArrowSquareOut,
  PiBracketsCurly,
  PiFileArrowDown,
  PiShieldCheck,
} from "react-icons/pi";
import { useOpenDataController } from "./open-data.controller";
interface Download {
  label: string;
  type: string;
  href: string;
  schema?: string;
}
function Downloads(p: { items: Download[]; schemaLabel: string }) {
  return (
    <ul className="download-list">
      {p.items.map((item) => (
        <li key={item.href}>
          <a href={item.href} type={item.type}>
            <PiFileArrowDown size={20} aria-hidden="true" />
            {item.label}
          </a>
          <span className="download-meta">
            <code>{item.type}</code>
            {item.schema && (
              <a href={item.schema} className="download-schema">
                <PiBracketsCurly size={16} aria-hidden="true" />
                {p.schemaLabel}
                <span className="sr-only"> {item.label}</span>
              </a>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
export function OpenData() {
  const c = useOpenDataController();
  const { t } = c;
  return (
    <div className="page open-data-page">
      <h1>{t("openData")}</h1>
      <p className="page-subtitle">{t("openDataSubtitle")}</p>
      <div className="account-sections">
        <section className="account-section" aria-labelledby="open-license">
          <h2 id="open-license">{t("openDataLicense")}</h2>
          <p>
            {t("openDataLicenseBody")}{" "}
            <a href={c.license.url} rel="license">
              {c.license.name}
              <PiArrowSquareOut size={16} aria-hidden="true" />
            </a>
          </p>
          <p className="open-data-privacy">
            <PiShieldCheck size={20} aria-hidden="true" />
            {t("openDataPrivacy")}
          </p>
        </section>
        <section className="account-section" aria-labelledby="open-facilities">
          <h2 id="open-facilities">{t("openDataFacilities")}</h2>
          <p>{t("openDataFacilitiesBody")}</p>
          <Downloads items={c.facilities} schemaLabel={t("openDataSchema")} />
        </section>
        <section className="account-section" aria-labelledby="open-occupancy">
          <h2 id="open-occupancy">{t("openDataOccupancy")}</h2>
          <p>{t("openDataOccupancyBody")}</p>
          <Downloads items={c.occupancy} schemaLabel={t("openDataSchema")} />
        </section>
        <section className="account-section" aria-labelledby="open-catalog">
          <h2 id="open-catalog">{t("openDataCatalog")}</h2>
          <p>{t("openDataCatalogBody")}</p>
          <Downloads items={c.catalogs} schemaLabel={t("openDataSchema")} />
          <a href={c.apiDocs} className="open-data-api">
            {t("openDataApi")}
          </a>
        </section>
      </div>
    </div>
  );
}
