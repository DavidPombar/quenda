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
  abstract remove(token: string): Promise<void>;
}
