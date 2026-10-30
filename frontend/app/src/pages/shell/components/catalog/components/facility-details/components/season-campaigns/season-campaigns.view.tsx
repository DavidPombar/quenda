// SPDX-License-Identifier: AGPL-3.0-or-later
import type { TextKey } from "@/services/i18n.service";
import type { Locale } from "@/types/models";
import { useSeasonCampaignsController } from "./season-campaigns.controller";
/** Published season campaigns covering this facility, for transparency (#17). */
export function SeasonCampaigns(p: {
  slug: string;
  facilityId: string;
  locale: Locale;
  t: (key: TextKey) => string;
}) {
  const c = useSeasonCampaignsController(p);
  if (!c.campaigns.length) return null;
  return (
    <>
      <h3>{p.t("seasonCampaigns")}</h3>
      {c.campaigns.map((campaign) => (
        <div key={campaign.id} className="season-campaign">
          <p>
            <strong>{campaign.name}</strong> · {campaign.period}
          </p>
          {campaign.criteria && (
            <p className="muted small">
              {p.t("seasonCriteria")}: {campaign.criteria}
            </p>
          )}
        </div>
      ))}
    </>
  );
}
