// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHmac, timingSafeEqual } from "node:crypto";
/** RFC 6238 time-based one-time passwords: HMAC-SHA1, 30-second steps, 6 digits. */
export const STEP_SECONDS = 30;
const DIGITS = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
/** RFC 4648 base32 without padding, as authenticator apps expect it. */
export function base32(bytes: Buffer) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  return output;
}
export function fromBase32(text: string) {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of text.replace(/=+$/, "").toUpperCase()) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) throw new Error("Invalid base32");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
export function stepAt(epochSeconds: number) {
  return Math.floor(epochSeconds / STEP_SECONDS);
}
/** The code for one step (RFC 4226 dynamic truncation). */
export function codeAt(secret: Buffer, step: number, digits = DIGITS) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const mac = createHmac("sha1", secret).update(counter).digest();
  const offset = mac[mac.length - 1] & 15;
  const binary = mac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** digits).padStart(digits, "0");
}
/**
 * The step whose code matches, within one step either side for clock drift, and strictly after
 * the last accepted step so a code works only once; null otherwise.
 */
export function matchingStep(args: {
  secret: Buffer;
  code: string;
  epochSeconds: number;
  lastStep: number | null;
}) {
  const now = stepAt(args.epochSeconds);
  const code = Buffer.from(args.code.trim());
  for (const step of [now - 1, now, now + 1]) {
    if (args.lastStep !== null && step <= args.lastStep) continue;
    const expected = Buffer.from(codeAt(args.secret, step));
    if (expected.length === code.length && timingSafeEqual(expected, code))
      return step;
  }
  return null;
}
/** Address an authenticator app reads from the QR code. */
export function otpauthUri(args: {
  secret: string;
  account: string;
  issuer: string;
}) {
  const label = encodeURIComponent(`${args.issuer}:${args.account}`);
  const query = new URLSearchParams({
    secret: args.secret,
    issuer: args.issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}
