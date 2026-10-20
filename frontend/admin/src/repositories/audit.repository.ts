// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { AuditEvent, AuditFilters } from "@/types/models";
export const auditRepository = {
  list: (filters: AuditFilters) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters))
      if (value !== undefined && value !== "") params.set(key, String(value));
    const query = params.toString();
    return apiClient.request<AuditEvent[]>(
      `manager/audit${query ? `?${query}` : ""}`,
    );
  },
};
