// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type {
  Campaign,
  CampaignInput,
  Organization,
  OrganizationInput,
  SeasonAllocation,
  SeasonAssignment,
  SeasonSlotInput,
} from "@/types/models";
const json = (method: string, body: unknown) => ({
  method,
  body: JSON.stringify(body),
});
export const seasonsRepository = {
  organizations: () =>
    apiClient.request<Organization[]>("manager/organizations"),
  createOrganization: (input: OrganizationInput) =>
    apiClient.request<{ id: string }>(
      "manager/organizations",
      json("POST", input),
    ),
  updateOrganization: (args: {
    id: string;
    input: OrganizationInput & { archived?: boolean };
  }) =>
    apiClient.request<void>(
      `manager/organizations/${args.id}`,
      json("PATCH", args.input),
    ),
  addRepresentative: (args: { organizationId: string; email: string }) =>
    apiClient.request<{ userId: string }>(
      `manager/organizations/${args.organizationId}/representatives`,
      json("POST", { email: args.email }),
    ),
  removeRepresentative: (args: { organizationId: string; userId: string }) =>
    apiClient.request<void>(
      `manager/organizations/${args.organizationId}/representatives/${args.userId}`,
      { method: "DELETE" },
    ),
  campaigns: () => apiClient.request<Campaign[]>("manager/season-campaigns"),
  saveCampaign: (args: { id?: string; input: CampaignInput }) =>
    apiClient.request<{ id: string } | void>(
      `manager/season-campaigns${args.id ? `/${args.id}` : ""}`,
      json(args.id ? "PATCH" : "POST", args.input),
    ),
  allocations: (campaignId: string) =>
    apiClient.request<SeasonAllocation[]>(
      `manager/season-allocations?campaignId=${encodeURIComponent(campaignId)}`,
    ),
  assign: (input: SeasonSlotInput) =>
    apiClient.request<SeasonAssignment>(
      "manager/season-allocations",
      json("POST", input),
    ),
  cancelAllocation: (args: { id: string; reason: string }) =>
    apiClient.request<{ freed: number }>(
      `manager/season-allocations/${args.id}`,
      json("PATCH", { status: "cancelled", reason: args.reason }),
    ),
  cancelDate: (args: { id: string; reason: string }) =>
    apiClient.request<void>(
      `manager/season-occurrences/${args.id}`,
      json("PATCH", { status: "cancelled", reason: args.reason }),
    ),
};
