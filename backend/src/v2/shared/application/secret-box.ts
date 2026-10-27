// SPDX-License-Identifier: AGPL-3.0-or-later
/** Encrypts secrets kept in the database (signing keys, webhook secrets). */
export abstract class SecretBox {
  abstract seal(plaintext: string): string;
  /** Throws when the value was not sealed with the configured secret. */
  abstract open(sealed: string): string;
}
