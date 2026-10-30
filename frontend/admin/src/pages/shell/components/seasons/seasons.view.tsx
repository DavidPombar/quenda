// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { Organizations } from "./components/organizations/organizations.view";
import { Campaigns } from "./components/campaigns/campaigns.view";
import { Schedule } from "./components/schedule/schedule.view";
import { useSeasonsController } from "./seasons.controller";
export function Seasons() {
  const c = useSeasonsController();
  const { t } = c;
  const failed =
    c.organizations.isError || c.campaigns.isError || c.facilities.isError;
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>{t("seasons")}</h1>
          <p className="page-subtitle">{t("seasonsSubtitle")}</p>
        </div>
      </div>
      {!c.isManager ? (
        <div className="empty-state">
          <SpotArt kind="access" />
          <h2>{t("managerOnly")}</h2>
          <p>{t("managerPrompt")}</p>
          <Button colorPalette="court" onClick={c.signIn}>
            {t("signIn")}
          </Button>
        </div>
      ) : failed ? (
        <Feedback
          message={t("loadError")}
          error
          retryLabel={t("retry")}
          retry={() => {
            void c.organizations.refetch();
            void c.campaigns.refetch();
            void c.facilities.refetch();
          }}
        />
      ) : !c.organizations.data || !c.campaigns.data || !c.facilities.data ? (
        <Feedback message={t("loading")} />
      ) : (
        <div className="settings-sections">
          <Organizations organizations={c.organizations.data} t={t} />
          <Campaigns
            campaigns={c.campaigns.data}
            facilities={c.facilities.data}
            selected={c.campaign?.id ?? ""}
            onSelect={c.chooseCampaign}
            t={t}
            locale={c.locale}
          />
          {c.campaign && (
            <Schedule
              campaign={c.campaign}
              organizations={c.organizations.data}
              facilities={c.facilities.data}
              t={t}
              locale={c.locale}
              timezone={c.municipality.timezone}
            />
          )}
        </div>
      )}
    </div>
  );
}
