// SPDX-License-Identifier: AGPL-3.0-or-later
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useListOrganizationsQuery } from "@/queries/seasons/list-organizations.query";
import { useListCampaignsQuery } from "@/queries/seasons/list-campaigns.query";
import { useListFacilitiesQuery } from "@/queries/facilities/list-facilities.query";
import type { AppContext } from "@/types/app-context";
/** Season allocation to clubs (#17): clubs, campaigns and the weekly schedule of each campaign. */
export function useSeasonsController() {
  const context = useOutletContext<AppContext>();
  const isManager = context.session?.role === "manager";
  const tenantId = isManager ? context.municipality.id : undefined;
  const organizations = useListOrganizationsQuery(tenantId);
  const campaigns = useListCampaignsQuery(tenantId);
  const facilities = useListFacilitiesQuery(context.municipality.slug);
  const [params, setParams] = useSearchParams();
  const chosen = params.get("campanha") ?? "";
  const campaign =
    campaigns.data?.find((item) => item.id === chosen) ??
    campaigns.data?.[0] ??
    null;
  return {
    ...context,
    isManager,
    organizations,
    campaigns,
    facilities,
    campaign,
    chooseCampaign: (id: string) =>
      setParams(id ? { campanha: id } : {}, { replace: true }),
  };
}
