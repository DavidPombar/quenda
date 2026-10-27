// SPDX-License-Identifier: AGPL-3.0-or-later
export type Permission =
  | "bookings:own"
  | "account:own"
  | "facilities:manage"
  | "insights:view"
  | "audit:view"
  | "municipality:manage"
  | "bookings:manage"
  | "access:control";
/** Access staff only check people in and mark absences at the facility. */
export type Role = "citizen" | "manager" | "access";
export interface Principal {
  userId: string;
  tenantId: string;
  displayName: string;
  role: Role;
  grants: readonly Permission[];
}
export function can(principal: Principal, permission: Permission) {
  return principal.grants.includes(permission);
}
