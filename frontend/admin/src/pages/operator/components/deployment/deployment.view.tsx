// SPDX-License-Identifier: AGPL-3.0-or-later
import { Link } from "react-router-dom";
import { Button } from "@chakra-ui/react";
import { PiPlus, PiUserPlus } from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { useDeploymentController } from "./deployment.controller";
import { MunicipalityForm } from "./components/municipality-form/municipality-form.view";
import { ManagerForm } from "./components/manager-form/manager-form.view";
export function Deployment() {
  const c = useDeploymentController();
  const { t } = c;
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>{t("operatorMunicipalities")}</h1>
          <p className="page-subtitle">{t("operatorMunicipalitiesSubtitle")}</p>
        </div>
        <Button colorPalette="court" onClick={c.openCreate}>
          <PiPlus size={18} aria-hidden="true" />
          {t("operatorNewMunicipality")}
        </Button>
      </div>
      {c.notice && (
        <p role="status" className="success-message">
          {c.notice}
        </p>
      )}
      {c.municipalities.isError ? (
        <Feedback
          message={t("loadError")}
          error
          retryLabel={t("retry")}
          retry={() => {
            void c.municipalities.refetch();
          }}
        />
      ) : c.municipalities.isPending ? (
        <Feedback message={t("loading")} />
      ) : (
        <ul className="deployment-list">
          {c.municipalities.data.map((item) => (
            <li key={item.settings.id}>
              <section
                className="deployment-card"
                aria-labelledby={`municipality-${item.settings.id}`}
              >
                <div className="deployment-card-heading">
                  <h2 id={`municipality-${item.settings.id}`}>
                    {item.settings.name}
                  </h2>
                  <code>{item.settings.slug}</code>
                </div>
                <dl className="facts">
                  <div>
                    <dt>{t("operatorFacilities")}</dt>
                    <dd>
                      {item.activeFacilities} / {item.facilities}{" "}
                      <span className="muted">{t("operatorActive")}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("defaultLanguage")}</dt>
                    <dd>
                      {t(
                        item.settings.locale === "es" ? "spanish" : "galician",
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("operatorRules")}</dt>
                    <dd>
                      {item.settings.advanceDays} {t("operatorDaysAhead")} ·{" "}
                      {item.settings.cancellationHours}{" "}
                      {t("operatorHoursToCancel")} ·{" "}
                      {item.settings.maxActiveBookings}{" "}
                      {t("operatorActiveLimit")}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("contactLabel")}</dt>
                    <dd>{item.settings.contact}</dd>
                  </div>
                  <div>
                    <dt>{t("legalVersionLabel")}</dt>
                    <dd>
                      <code>{item.settings.legalVersion}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("operatorManagers")}</dt>
                    <dd>
                      {item.managers.length
                        ? item.managers
                            .map((manager) => manager.displayName)
                            .join(", ")
                        : t("operatorNoManagers")}
                    </dd>
                  </div>
                </dl>
                <div className="settings-actions">
                  <Button variant="outline" onClick={() => c.openManager(item)}>
                    <PiUserPlus size={18} aria-hidden="true" />
                    {t("operatorAddManager")}
                  </Button>
                  <Link
                    className="text-link"
                    to={c.managementUrl(item.settings.slug)}
                  >
                    {t("operatorOpenManagement")}
                  </Link>
                </div>
              </section>
            </li>
          ))}
        </ul>
      )}
      {c.creating && (
        <MunicipalityForm t={t} locale={c.locale} onClose={c.closeCreate} />
      )}
      {c.addingManager && (
        <ManagerForm
          t={t}
          municipality={c.addingManager}
          onClose={c.closeManager}
        />
      )}
    </div>
  );
}
