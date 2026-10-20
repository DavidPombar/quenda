// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/client/api-client";
import { auditRepository } from "@/repositories/audit.repository";
import type { AuditFilters } from "@/types/models";
export function useListAuditQuery(
  tenantId: string | undefined,
  filters: AuditFilters,
) {
  return useQuery({
    queryKey: ["audit", tenantId, filters],
    queryFn: () => auditRepository.list(filters),
    enabled: !!tenantId,
  });
}
export function isForbiddenError(error: unknown) {
  return error instanceof ApiError && error.status === 403;
}
