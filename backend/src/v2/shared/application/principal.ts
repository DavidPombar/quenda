// SPDX-License-Identifier: AGPL-3.0-or-later
export type Permission =
  | "bookings:own"
  | "account:own"
  | "facilities:manage"
  | "insights:view"
  | "audit:view"
  | "municipality:manage"
  | "categories:manage"
  | "bookings:manage"
  | "data:export"
  | "access:control";
/** Door staff only record entries and attendance. */
export type Role = "citizen" | "manager" | "access";
/** How strongly the account's identity was proven: demo account, e-mail code, eID (OIDC) or local credentials. */
export type Assurance = "demo" | "email" | "eid" | "local";
export interface Principal {
  userId: string;
  tenantId: string;
  displayName: string;
  role: Role;
  assurance: Assurance;
  grants: readonly Permission[];
}
export function can(principal: Principal, permission: Permission) {
  return principal.grants.includes(permission);
}
