// SPDX-License-Identifier: AGPL-3.0-or-later
import { Principal } from "../../../../shared/application/principal";
export type PrincipalRow = Omit<Principal, "grants">;
/** Column projection for a `users` row aliased as `u`. */
export const principalColumns =
  'u.id AS "userId", u.tenant_id AS "tenantId", u.display_name AS "displayName", u.role, u.assurance';
export function toPrincipal(user: PrincipalRow): Principal {
  return {
    ...user,
    grants:
      user.role === "manager"
        ? [
            "bookings:own",
            "facilities:manage",
            "insights:view",
            "audit:view",
            "municipality:manage",
            "categories:manage",
            "bookings:manage",
            "data:export",
            "access:control",
          ]
        : user.role === "access"
          ? ["access:control"]
          : ["bookings:own", "account:own"],
  };
}
