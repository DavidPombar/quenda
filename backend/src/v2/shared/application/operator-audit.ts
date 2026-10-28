// SPDX-License-Identifier: AGPL-3.0-or-later
import type { AuditDetails } from "./audit";
import type { OperatorPrincipal } from "./operator-principal";
export abstract class OperatorAudit {
  /**
   * Records an operator action in the deployment trail and, when it affects a municipality,
   * mirrors it to that municipality's audit as a system event naming the operator.
   */
  abstract record(
    principal: OperatorPrincipal,
    action: string,
    resourceId: string,
    tenantId: string | null,
    details?: AuditDetails,
  ): Promise<void>;
}
