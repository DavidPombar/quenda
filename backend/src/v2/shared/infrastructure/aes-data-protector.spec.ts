// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { AesDataProtector } from "./aes-data-protector";
const key = randomBytes(32).toString("base64");
describe("AesDataProtector", () => {
  it("should round-trip values with a fresh IV each time when a key is configured", () => {
    const protector = new AesDataProtector(key);
    const first = protector.encrypt("12345678Z");
    const second = protector.encrypt("12345678Z");
    expect(protector.available()).toBe(true);
    expect(first).not.toBe(second);
    expect(first).not.toContain("12345678Z");
    expect(protector.decrypt(first)).toBe("12345678Z");
    expect(protector.digest("12345678Z")).toBe(protector.digest("12345678Z"));
  });
  it("should reject tampered ciphertexts and values from another key", () => {
    const protector = new AesDataProtector(key);
    const value = protector.encrypt("12345678Z");
    const tampered = `${value.slice(0, -2)}${value.endsWith("A") ? "B" : "A"}A`;
    expect(protector.decrypt(tampered)).toBeNull();
    expect(
      new AesDataProtector(randomBytes(32).toString("base64")).decrypt(value),
    ).toBeNull();
  });
  it("should be unavailable without a valid 32-byte key", () => {
    for (const missing of [undefined, "", "c2hvcnQ="]) {
      const protector = new AesDataProtector(missing);
      expect(protector.available()).toBe(false);
      expect(protector.decrypt("v1.a.b.c")).toBeNull();
      expect(() => protector.encrypt("x")).toThrow();
      expect(() => protector.digest("x")).toThrow();
    }
  });
});
