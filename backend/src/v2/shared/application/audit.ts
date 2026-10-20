// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Principal } from "./principal";
export type AuditDetails = Record<string, unknown>;
export abstract class Audit {
  abstract record(
    principal: Principal,
    action: string,
    resourceId: string,
    details?: AuditDetails,
  ): Promise<void>;
  /** Records an action performed by the platform itself (actor_id NULL, actor_role 'system'). */
  abstract recordSystem(
    tenantId: string,
    action: string,
    resourceId: string,
    details?: AuditDetails,
  ): Promise<void>;
}
