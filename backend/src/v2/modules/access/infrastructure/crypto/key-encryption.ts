// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
// Local demonstration only; production refuses to start without its own key (see `masterKey`).
const developmentKey = createHash("sha256")
  .update("quenda-development-key-encryption-key")
  .digest();
/**
 * Deployment key that seals municipal secrets at rest: base64 of 32 random bytes in
 * QUENDA_KEY_ENCRYPTION_KEY, e.g. `openssl rand -base64 32`.
 */
export function masterKey() {
  const value = process.env.QUENDA_KEY_ENCRYPTION_KEY;
  if (value) {
    const key = Buffer.from(value, "base64");
    if (key.length !== 32)
      throw new Error("QUENDA_KEY_ENCRYPTION_KEY must be 32 bytes in base64");
    return key;
  }
  if (process.env.NODE_ENV === "production")
    throw new Error("QUENDA_KEY_ENCRYPTION_KEY is required in production");
  return developmentKey;
}
/** AES-256-GCM, bound to its owner (`context`) so a sealed value cannot be moved between rows. */
export function seal(plain: Buffer, context: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  cipher.setAAD(Buffer.from(context));
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
}
export function open(sealed: Buffer, context: string) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    masterKey(),
    sealed.subarray(0, 12),
  );
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(sealed.subarray(12, 28));
  return Buffer.concat([
    decipher.update(sealed.subarray(28)),
    decipher.final(),
  ]);
}
