// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { MyEnrolment } from "@/types/models";
export const enrolmentsRepository = {
  list: () => apiClient.request<MyEnrolment[]>("citizen/activity-enrolments"),
  enrol: (body: {
    id: string;
    activityId: string;
    dependantId?: string | null;
  }) =>
    apiClient.request<MyEnrolment>("citizen/activity-enrolments", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  leave: (id: string) =>
    apiClient.request<void>(`citizen/activity-enrolments/${id}`, {
      method: "DELETE",
    }),
};
