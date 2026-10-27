// SPDX-License-Identifier: AGPL-3.0-or-later
import { useAccessibilityController } from "./accessibility.controller";
export function Accessibility() {
  const c = useAccessibilityController();
  return (
    <div className="page statement">
      <h1>{c.t("a11yTitle")}</h1>
      <p className="page-subtitle">
        {c.municipality} {c.t("a11yIntro")}
      </p>
      <section className="statement-section" aria-labelledby="a11y-status">
        <h2 id="a11y-status">{c.t("a11yStatusTitle")}</h2>
        <p>{c.t("a11yStatus")}</p>
        <p>{c.t("a11yStandard")}</p>
      </section>
      <section className="statement-section" aria-labelledby="a11y-content">
        <h2 id="a11y-content">{c.t("a11yContentTitle")}</h2>
        <h3>{c.t("a11yNonCompliance")}</h3>
        <ul>
          <li>{c.t("a11yManualPending")}</li>
          {c.exceptions && <li>{c.exceptions}</li>}
        </ul>
        <h3>{c.t("a11yBurdenTitle")}</h3>
        <p>{c.t("a11yBurden")}</p>
        <h3>{c.t("a11yScopeTitle")}</h3>
        <p>{c.t("a11yScope")}</p>
      </section>
      <section className="statement-section" aria-labelledby="a11y-prepared">
        <h2 id="a11y-prepared">{c.t("a11yPreparationTitle")}</h2>
        <dl className="facts">
          <div>
            <dt>{c.t("a11yReviewedOn")}</dt>
            <dd>{c.reviewedOn}</dd>
          </div>
          <div>
            <dt>{c.t("a11yMethod")}</dt>
            <dd>{c.method}</dd>
          </div>
          <div>
            <dt>{c.t("a11yAutomated")}</dt>
            <dd>{c.t("a11yAutomatedValue")}</dd>
          </div>
        </dl>
        <p>{c.t("a11yReviewCycle")}</p>
      </section>
      <section className="statement-section" aria-labelledby="a11y-contact">
        <h2 id="a11y-contact">{c.t("a11yContactTitle")}</h2>
        <p>{c.t("a11yContactBody")}</p>
        <dl className="facts">
          <div>
            <dt>{c.t("a11yUnit")}</dt>
            <dd>{c.unit}</dd>
          </div>
          <div>
            <dt>{c.t("a11yEmail")}</dt>
            <dd>
              <a href={`mailto:${c.email}`}>{c.email}</a>
            </dd>
          </div>
          {c.phone && (
            <div>
              <dt>{c.t("a11yPhone")}</dt>
              <dd>
                <a href={`tel:${c.phone.replace(/\s+/g, "")}`}>{c.phone}</a>
              </dd>
            </div>
          )}
        </dl>
      </section>
      <section className="statement-section" aria-labelledby="a11y-enforce">
        <h2 id="a11y-enforce">{c.t("a11yEnforcementTitle")}</h2>
        <p>{c.t("a11yEnforcement")}</p>
      </section>
    </div>
  );
}
