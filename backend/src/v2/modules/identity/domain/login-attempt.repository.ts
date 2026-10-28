// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export interface LoginAttempt {
  tenantId: string;
  nonce: string;
  codeVerifier: string;
  legalVersion: string | null;
  returnTo: string;
  expiresAt: Temporal.Instant;
}
/** Pending OIDC sign-ins. Only a hash of the state is stored. */
export abstract class LoginAttemptRepository {
  abstract save(state: string, attempt: LoginAttempt): Promise<void>;
  /** Deletes and returns the attempt (expired or not) so a state can be used once at most. */
  abstract take(state: string): Promise<LoginAttempt | null>;
}
