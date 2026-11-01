// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { OperatorPrincipal } from "../../../shared/application/operator-principal";
export abstract class OperatorSessionRepository {
  /** First active operator; the demo sign-in stands in for an identity provider (#36). */
  abstract findDemoOperator(): Promise<OperatorPrincipal | null>;
  abstract create(
    principal: OperatorPrincipal,
    expiresAt: Temporal.Instant,
  ): Promise<string>;
  abstract find(
    token: string,
    now: Temporal.Instant,
  ): Promise<OperatorPrincipal | null>;
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
}
