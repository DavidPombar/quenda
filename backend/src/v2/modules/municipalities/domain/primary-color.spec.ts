// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { contrastWithWhite, isAccessiblePrimaryColor } from "./primary-color";
describe("primary colour contrast", () => {
  it("should match the WCAG ratio for black and white", () => {
    expect(contrastWithWhite("#000000")).toBeCloseTo(21, 5);
    expect(contrastWithWhite("#ffffff")).toBeCloseTo(1, 5);
  });
  it("should accept the default court green and reject light colours", () => {
    expect(isAccessiblePrimaryColor("#1f5b43")).toBe(true);
    expect(isAccessiblePrimaryColor("#767676")).toBe(true);
    expect(isAccessiblePrimaryColor("#777777")).toBe(false);
    expect(isAccessiblePrimaryColor("#ffd700")).toBe(false);
  });
  it("should reject malformed or uppercase values", () => {
    expect(isAccessiblePrimaryColor("#1F5B43")).toBe(false);
    expect(isAccessiblePrimaryColor("1f5b43")).toBe(false);
  });
});
