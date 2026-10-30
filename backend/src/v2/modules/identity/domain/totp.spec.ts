// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import {
  base32,
  codeAt,
  fromBase32,
  matchingStep,
  otpauthUri,
  stepAt,
} from "./totp";
// RFC 6238 appendix B: SHA-1 secret "12345678901234567890", 8-digit codes.
const secret = Buffer.from("12345678901234567890");
describe("TOTP (RFC 6238)", () => {
  it("should match the RFC test vectors", () => {
    for (const [time, code] of [
      [59, "94287082"],
      [1111111109, "07081804"],
      [1111111111, "14050471"],
      [1234567890, "89005924"],
      [2000000000, "69279037"],
      [20000000000, "65353130"],
    ] as const)
      expect(codeAt(secret, stepAt(time), 8)).toBe(code);
  });
  it("should round-trip base32 like authenticator apps", () => {
    expect(base32(secret)).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    expect(fromBase32(base32(secret)).equals(secret)).toBe(true);
  });
  it("should accept one step of drift and never the same step twice", () => {
    const now = 1234567890;
    const code = codeAt(secret, stepAt(now) - 1);
    const step = matchingStep({
      secret,
      code,
      epochSeconds: now,
      lastStep: null,
    });
    expect(step).toBe(stepAt(now) - 1);
    expect(
      matchingStep({ secret, code, epochSeconds: now, lastStep: step }),
    ).toBeNull();
    expect(
      matchingStep({
        secret,
        code: codeAt(secret, stepAt(now) - 2),
        epochSeconds: now,
        lastStep: null,
      }),
    ).toBeNull();
  });
  it("should build the address that authenticator apps read", () => {
    expect(
      otpauthUri({
        secret: "ABC",
        account: "uxia",
        issuer: "Quenda · Vilaverde",
      }),
    ).toBe(
      "otpauth://totp/Quenda%20%C2%B7%20Vilaverde%3Auxia?secret=ABC&issuer=Quenda+%C2%B7+Vilaverde&algorithm=SHA1&digits=6&period=30",
    );
  });
});
