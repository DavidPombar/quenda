// SPDX-License-Identifier: AGPL-3.0-or-later
import { Link } from "react-router-dom";
import { PiBuildings, PiUsersThree } from "react-icons/pi";
import logoMark from "@/assets/illustrations/logo-mark.svg";
import { Feedback } from "@/components/feedback/feedback.view";
import { useHomeController } from "./home.controller";
/** Entry point: a municipality's management or the supramunicipal area (#18). */
export function Home() {
  const c = useHomeController();
  if (!c.query.data)
    return (
      <Feedback
        error={c.query.isError}
        message={c.t(c.query.isError ? "loadError" : "loading")}
        retryLabel={c.t("retry")}
        retry={
          c.query.isError
            ? () => {
                void c.query.refetch();
              }
            : undefined
        }
      />
    );
  return (
    <main id="main" className="home-chooser">
      <img className="brand-symbol" src={logoMark} alt="" />
      <h1>{c.t("homeTitle")}</h1>
      <section aria-labelledby="home-municipalities">
        <h2 id="home-municipalities">{c.t("homeMunicipalities")}</h2>
        <ul className="home-links">
          {c.query.data.map((municipality) => (
            <li key={municipality.id}>
              <Link to={c.managementUrl(municipality.slug)}>
                <PiBuildings size={20} aria-hidden="true" />
                {municipality.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="home-operator">
        <h2 id="home-operator">{c.t("operatorArea")}</h2>
        <p>{c.t("homeOperatorBody")}</p>
        <ul className="home-links">
          <li>
            <Link to={c.operatorUrl}>
              <PiUsersThree size={20} aria-hidden="true" />
              {c.t("homeOperatorLink")}
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
