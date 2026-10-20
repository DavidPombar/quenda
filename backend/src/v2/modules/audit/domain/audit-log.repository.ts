// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { AuditEntry } from "./audit-entry.read-model";
export interface AuditLogFilter {
  from?: Temporal.Instant;
  to?: Temporal.Instant;
  action?: string;
  limit: number;
}
export abstract class AuditLogRepository {
  /** Newest first. `from` is inclusive and `to` exclusive. */
  abstract list(
    tenantId: string,
    filter: AuditLogFilter,
  ): Promise<AuditEntry[]>;
}
