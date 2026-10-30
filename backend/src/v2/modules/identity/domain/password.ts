// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
/** scrypt cost (N=2^15, r=8, p=1): about 32 MiB and a few tens of milliseconds per check. */
const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;
const MAX_MEMORY = 64 * 1024 * 1024;
export const MIN_PASSWORD_LENGTH = 12;
function derive(
  password: string,
  salt: Buffer,
  n: number,
  r: number,
  p: number,
) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(
      password.normalize("NFKC"),
      salt,
      KEY_LENGTH,
      { N: n, r, p, maxmem: MAX_MEMORY },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
}
/** Self-describing hash: `scrypt$N$r$p$salt$hash`, both in base64url. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return [
    "scrypt",
    N,
    R,
    P,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}
export async function verifyPassword(password: string, stored: string) {
  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const key = await derive(
    password,
    Buffer.from(salt, "base64url"),
    Number(n),
    Number(r),
    Number(p),
  );
  return key.length === expected.length && timingSafeEqual(key, expected);
}
/** At least twelve characters, and not the login itself. */
export function acceptablePassword(password: string, login: string) {
  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= 256 &&
    password.trim().toLowerCase() !== login.toLowerCase()
  );
}
/** Login names: lower-case letters, digits, dots, dashes and underscores. */
export const LOGIN = /^[a-z0-9._-]{3,64}$/;
export function normaliseLogin(value: string) {
  const login = value.trim().toLowerCase();
  return LOGIN.test(login) ? login : null;
}
