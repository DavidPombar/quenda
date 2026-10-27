// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { AccessClaims } from "./access-credential";
export interface PublicSigningKey {
  id: string;
  /** Raw Ed25519 public key, base64url, as the `x` member of an OKP JWK (RFC 8037). */
  x: string;
  createdAt: Temporal.Instant;
}
/**
 * The municipality's signing keys. Each municipality has one active key, created with it (or on
 * first use for installations that predate access control); private halves never leave the adapter.
 */
export abstract class CredentialKeys {
  abstract sign(tenantId: string, claims: AccessClaims): Promise<string>;
  /** Claims of a token signed by the tenant's active key, or null when it is not authentic. */
  abstract verify(
    tenantId: string,
    token: string,
  ): Promise<AccessClaims | null>;
  abstract active(tenantId: string): Promise<PublicSigningKey>;
  /** Retires the active key, revoking every credential it signed, and creates a new one. */
  abstract rotate(
    tenantId: string,
    at: Temporal.Instant,
  ): Promise<PublicSigningKey>;
}
