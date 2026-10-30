// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash, timingSafeEqual } from "node:crypto";
/** Codes stay valid ten minutes and allow five attempts; an address gets five per hour. */
export const CODE_MINUTES = 10;
export const CODE_ATTEMPTS = 5;
export const CODES_PER_HOUR = 5;
/** The issuer recorded in `identities` for accounts opened by email. */
export const EMAIL_ISSUER = "email";
const EMAIL = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
/** Lower-case and trimmed, or null when it does not look like an address. */
export function normaliseEmail(value: string) {
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL.test(email) ? email : null;
}
const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function emailHash(email: string) {
  return sha256(email);
}
/** The code is hashed with its row id, so equal codes never share a hash. */
export function codeHash(id: string, code: string) {
  return sha256(`${id}:${code}`);
}
export function codeMatches(id: string, code: string, hash: string) {
  const a = Buffer.from(codeHash(id, code.trim()));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}
/** Display name for an account opened by email: the part before the @. */
export function nameFromEmail(email: string) {
  return email.split("@")[0].slice(0, 200) || email;
}
