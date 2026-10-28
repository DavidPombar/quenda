// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { normaliseNif, safeReturnTo } from "./sign-in-target";
describe("safeReturnTo", () => {
  it("should keep paths inside the citizen app", () => {
    expect(safeReturnTo("vilaverde", "/app/vilaverde/reservas?x=1")).toBe(
      "/app/vilaverde/reservas?x=1",
    );
  });
  it("should fall back to the municipality catalog for anything else", () => {
    for (const value of [
      undefined,
      "https://evil.example/app/",
      "//evil.example/app/",
      "/admin/",
      "/app/../admin",
      "/app/\\evil.example",
      "/app/x\r\nLocation: https://evil.example",
    ])
      expect(safeReturnTo("vilaverde", value)).toBe(
        "/app/vilaverde/instalacions",
      );
  });
});
describe("normaliseNif", () => {
  it("should remove separators and the eIDAS prefix", () => {
    expect(normaliseNif("es/es/12.345.678-z")).toBe("12345678Z");
    expect(normaliseNif(" X1234567L ")).toBe("X1234567L");
  });
});
