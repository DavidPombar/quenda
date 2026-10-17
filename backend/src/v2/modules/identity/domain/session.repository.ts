// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { Principal } from "../../../shared/application/principal";
export abstract class SessionRepository {
  abstract findDemoUser(
    tenantId: string,
    role: "citizen" | "manager",
  ): Promise<Principal | null>;
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
