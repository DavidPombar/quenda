// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export interface AuditEntry {
  id: string;
  action: string;
  /** NULL for system actions and for events pseudonymised by retention. */
  actorId: string | null;
  actorRole: "citizen" | "manager" | "system" | null;
  actorName: string | null;
  resourceId: string;
  occurredAt: Temporal.Instant;
  details: Record<string, unknown> | null;
}
