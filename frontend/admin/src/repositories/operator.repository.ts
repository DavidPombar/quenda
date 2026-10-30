// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type {
  DateRange,
  DeploymentInsights,
  DeploymentMunicipality,
  MunicipalitySettings,
  NewManager,
  NewMunicipality,
  StaffMember,
  WebAnalytics,
} from "@/types/models";
export const operatorRepository = {
  municipalities: () =>
    apiClient.request<DeploymentMunicipality[]>("operator/municipalities"),
  createMunicipality: (body: NewMunicipality) =>
    apiClient.request<MunicipalitySettings>("operator/municipalities", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  createManager: (args: { municipalityId: string; manager: NewManager }) =>
    apiClient.request<StaffMember>(
      `operator/municipalities/${args.municipalityId}/managers`,
      { method: "POST", body: JSON.stringify(args.manager) },
    ),
  insights: (range: DateRange) =>
    apiClient.request<DeploymentInsights>(
      `operator/insights?${new URLSearchParams({ ...range }).toString()}`,
    ),
  webAnalytics: (range: DateRange) =>
    apiClient.request<WebAnalytics>(
      `operator/web-analytics?${new URLSearchParams({ ...range }).toString()}`,
    ),
};
