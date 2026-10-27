// SPDX-License-Identifier: AGPL-3.0-or-later
export type Permission =
  | "bookings:own"
  | "account:own"
  | "facilities:manage"
  | "insights:view"
  | "audit:view"
  | "municipality:manage"
  | "bookings:manage"
  | "bookings:attendance"
  | "access:validate";
export type Role = "citizen" | "manager" | "staff";
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
