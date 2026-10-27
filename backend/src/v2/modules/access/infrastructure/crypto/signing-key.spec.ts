// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import {
  generateSigningKey,
  jwsKeyId,
  signJws,
  verifyJws,
} from "./signing-key";
import { open, seal } from "./key-encryption";
describe("signing keys", () => {
  it("should sign a compact EdDSA JWS that only the matching public key verifies", () => {
    const key = generateSigningKey("tenant-a");
    const other = generateSigningKey("tenant-a");
    const token = signJws(key, { sub: "booking", exp: 1 });
    expect(jwsKeyId(token)).toBe(key.id);
    expect(verifyJws(token, key.publicKey)).toEqual({ sub: "booking", exp: 1 });
    expect(verifyJws(token, other.publicKey)).toBeNull();
    const [header, , signature] = token.split(".");
    const tampered = `${header}.${Buffer.from('{"sub":"other","exp":1}').toString("base64url")}.${signature}`;
    expect(verifyJws(tampered, key.publicKey)).toBeNull();
  });
  it("should seal secrets to their owner so they cannot be opened elsewhere", () => {
    const sealed = seal(Buffer.from("secret"), "tenant-a:key");
    expect(sealed.includes(Buffer.from("secret"))).toBe(false);
    expect(open(sealed, "tenant-a:key").toString()).toBe("secret");
    expect(() => open(sealed, "tenant-b:key")).toThrow();
  });
});
