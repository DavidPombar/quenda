// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type {
  ActivityInput,
  ManagedActivity,
  ManagedActivityDetails,
  ManagedEnrolmentPage,
} from "@/types/models";
const json = (method: string, body: unknown) => ({
  method,
  body: JSON.stringify(body),
});
export const activitiesRepository = {
  list: () => apiClient.request<ManagedActivity[]>("manager/activities"),
  get: (id: string) =>
    apiClient.request<ManagedActivityDetails>(
      `manager/activities/${encodeURIComponent(id)}`,
    ),
  save: (args: { id?: string; input: ActivityInput }) =>
    apiClient.request<ManagedActivityDetails>(
      `manager/activities${args.id ? `/${encodeURIComponent(args.id)}` : ""}`,
      json(args.id ? "PUT" : "POST", args.input),
    ),
  publish: (id: string) =>
    apiClient.request<ManagedActivityDetails>(
      `manager/activities/${encodeURIComponent(id)}/publication`,
      json("POST", {}),
    ),
  cancel: (args: { id: string; reason: string }) =>
    apiClient.request<void>(
      `manager/activities/${encodeURIComponent(args.id)}`,
      json("PATCH", { status: "cancelled", reason: args.reason }),
    ),
  enrolments: (args: {
    id: string;
    status: "enrolled" | "waiting" | null;
    page: number;
  }) =>
    apiClient.request<ManagedEnrolmentPage>(
      `manager/activities/${encodeURIComponent(args.id)}/enrolments?${new URLSearchParams(
        {
          page: String(args.page),
          ...(args.status ? { status: args.status } : {}),
        },
      )}`,
    ),
  removeEnrolment: (args: { id: string; reason: string }) =>
    apiClient.request<void>(
      `manager/activity-enrolments/${encodeURIComponent(args.id)}`,
      json("PATCH", { status: "removed", reason: args.reason }),
    ),
  cancelSession: (args: { id: string; reason: string }) =>
    apiClient.request<void>(
      `manager/activity-sessions/${encodeURIComponent(args.id)}`,
      json("PATCH", { status: "cancelled", reason: args.reason }),
    ),
};
