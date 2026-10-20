// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { Principal } from "../../../shared/application/principal";
export abstract class SessionRepository {
  /** Deleted (anonymised) accounts are never offered as demo identities. */
  abstract findDemoUser(
    tenantId: string,
    role: "citizen" | "manager",
  ): Promise<Principal | null>;
  abstract createDemoUser(args: {
    id: string;
    tenantId: string;
    role: "citizen" | "manager";
    displayName: string;
  }): Promise<Principal>;
  abstract create(
    principal: Principal,
    expiresAt: Temporal.Instant,
  ): Promise<string>;
  abstract find(
    token: string,
    now: Temporal.Instant,
  ): Promise<Principal | null>;
  abstract remove(token: string): Promise<void>;
}
