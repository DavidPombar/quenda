// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { Principal, Role } from "../../../shared/application/principal";
export abstract class SessionRepository {
  /** Deleted (anonymised) accounts are never offered as demo identities. */
  abstract findDemoUser(
    tenantId: string,
    role: Role,
  ): Promise<Principal | null>;
  abstract createDemoUser(args: {
    id: string;
    tenantId: string;
    role: Role;
    displayName: string;
    email: string | null;
  }): Promise<Principal>;
  abstract create(
    principal: Principal,
    expiresAt: Temporal.Instant,
  ): Promise<string>;
  abstract find(
    token: string,
    now: Temporal.Instant,
  ): Promise<Principal | null>;
  /** When a live session ends; null when it has ended or does not exist. */
  abstract expiry(
    token: string,
    now: Temporal.Instant,
  ): Promise<Temporal.Instant | null>;
  /** Moves a live session's end to `until` (WCAG 2.2.1); false when it has already ended. */
  abstract extend(
    token: string,
    now: Temporal.Instant,
    until: Temporal.Instant,
  ): Promise<boolean>;
  abstract remove(token: string): Promise<void>;
  /** Deletes sessions that expired at or before `now`; returns how many. */
  abstract removeExpired(now: Temporal.Instant): Promise<number>;
}
