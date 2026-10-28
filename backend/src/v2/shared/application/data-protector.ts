// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Field-level protection for sensitive personal data (NIF, TOTP secrets). Without a configured key
 * the protector is unavailable and callers must not store the data at all.
 */
export abstract class DataProtector {
  abstract available(): boolean;
  /** Authenticated encryption; throws when unavailable. */
  abstract encrypt(plaintext: string): string;
  /** Returns null when unavailable or when the ciphertext cannot be authenticated. */
  abstract decrypt(ciphertext: string): string | null;
  /** Keyed, deterministic digest for equality lookups; throws when unavailable. */
  abstract digest(value: string): string;
}
