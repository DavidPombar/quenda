// SPDX-License-Identifier: AGPL-3.0-or-later
import { useListSeasonCampaignsQuery } from "@/queries/seasons/list-season-campaigns.query";
import { longDayLabel } from "@/services/date.service";
import { fill, type TextKey } from "@/services/i18n.service";
import type { Locale } from "@/types/models";
export function useSeasonCampaignsController(p: {
  slug: string;
  facilityId: string;
  locale: Locale;
  t: (key: TextKey) => string;
}) {
  const query = useListSeasonCampaignsQuery(p.slug);
  return {
    campaigns: (query.data ?? [])
      .filter((campaign) => campaign.facilityIds.includes(p.facilityId))
      .map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        period: fill(p.t("seasonPeriod"), {
          from: longDayLabel(campaign.startsOn, p.locale),
          to: longDayLabel(campaign.endsOn, p.locale),
        }),
        criteria: campaign.criteria[p.locale],
      })),
  };
}
