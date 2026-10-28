// SPDX-License-Identifier: AGPL-3.0-or-later
/** Identity claims after the ID token has been validated (signature source, issuer, audience, nonce). */
export interface OidcClaims {
  issuer: string;
  subject: string;
  givenName: string | null;
  familyName: string | null;
  name: string | null;
  email: string | null;
  /** Spanish tax ID when the broker maps it (claim `nif`), e.g. from Cl@ve. */
  nif: string | null;
}
export type OidcExchangeOutcome =
  | { kind: "ok"; claims: OidcClaims }
  /** The provider could not be reached or answered with a server error. */
  | { kind: "unavailable" }
  /** The provider refused the code, or the response failed validation (nonce, issuer, PKCE…). */
  | { kind: "rejected" };
/**
 * Generic OpenID Connect relying party (authorization code flow with PKCE S256). Implementations
 * cache the discovery metadata; the first use may fetch it.
 */
export abstract class OidcProvider {
  /** True when the deployment configured an issuer, a client and its public URL. */
  abstract enabled(): boolean;
  /** Button label for the sign-in method, e.g. "Cl@ve"; null when disabled. */
  abstract label(): string | null;
  /** Authorization endpoint URL for a new attempt, or null when the provider is unavailable. */
  abstract authorizationUrl(args: {
    state: string;
    nonce: string;
    codeVerifier: string;
  }): Promise<string | null>;
  /** Redeems the authorization code. Performs network calls: never call inside a transaction. */
  abstract exchange(args: {
    code: string;
    state: string;
    issuer: string | null;
    codeVerifier: string;
    nonce: string;
  }): Promise<OidcExchangeOutcome>;
}
