// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import {
  acceptablePassword,
  hashPassword,
  normaliseLogin,
  verifyPassword,
} from "./password";
describe("Staff passwords", () => {
  it("should verify the password it hashed and nothing else", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(stored).toMatch(/^scrypt\$32768\$8\$1\$[\w-]+\$[\w-]+$/);
    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
    expect(await verifyPassword("correct horse batterY", stored)).toBe(false);
    expect(await verifyPassword("x", "plain")).toBe(false);
  });
  it("should salt each hash", async () => {
    expect(await hashPassword("same password")).not.toBe(
      await hashPassword("same password"),
    );
  });
  it("should ask for twelve characters that are not the login", () => {
    expect(acceptablePassword("short", "uxia")).toBe(false);
    expect(acceptablePassword("uxia.xestion", "uxia.xestion")).toBe(false);
    expect(acceptablePassword("long enough phrase", "uxia")).toBe(true);
  });
  it("should normalise login names", () => {
    expect(normaliseLogin(" Uxia.Xestion ")).toBe("uxia.xestion");
    expect(normaliseLogin("a b")).toBeNull();
  });
});
