// SPDX-License-Identifier: AGPL-3.0-or-later
/** Cryptographically secure random values for tokens, OIDC state/nonce/PKCE and one-time codes. */
export abstract class SecretGenerator {
  /** `bytes` random bytes encoded as unpadded base64url. */
  abstract randomToken(bytes: number): string;
  /** A uniformly distributed numeric code with exactly `digits` digits (leading zeros kept). */
  abstract numericCode(digits: number): string;
}
