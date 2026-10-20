// SPDX-License-Identifier: AGPL-3.0-or-later
export type Permission =
  "bookings:own" | "facilities:manage" | "insights:view" | "data:export";
export interface Principal {
  userId: string;
  tenantId: string;
  displayName: string;
  role: "citizen" | "manager";
  grants: readonly Permission[];
}
export function can(principal: Principal, permission: Permission) {
  return principal.grants.includes(permission);
}
