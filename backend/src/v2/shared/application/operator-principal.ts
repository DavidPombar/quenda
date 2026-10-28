// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Supramunicipal operator (deputación, mancomunidade). It has no tenant: it manages the
 * deployment and only ever reads configuration and aggregated, anonymous figures.
 */
export type OperatorPermission = "deployment:manage" | "deployment:insights";
export interface OperatorPrincipal {
  operatorId: string;
  displayName: string;
  grants: readonly OperatorPermission[];
}
export function canOperate(
  principal: OperatorPrincipal,
  permission: OperatorPermission,
) {
  return principal.grants.includes(permission);
}
