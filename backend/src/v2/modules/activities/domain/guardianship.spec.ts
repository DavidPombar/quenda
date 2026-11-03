// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { ageInYear, fitsAges } from "./guardianship";
describe("ages for activities", () => {
  it("should count the age reached in the year the activity starts", () => {
    expect(ageInYear(2017, 2026)).toBe(9);
  });
  it("should accept ages within the limits, both included, and ignore a missing limit", () => {
    expect(fitsAges(6, { minAge: 6, maxAge: 12 })).toBe(true);
    expect(fitsAges(12, { minAge: 6, maxAge: 12 })).toBe(true);
    expect(fitsAges(13, { minAge: 6, maxAge: 12 })).toBe(false);
    expect(fitsAges(3, { minAge: null, maxAge: 5 })).toBe(true);
    expect(fitsAges(70, { minAge: 16, maxAge: null })).toBe(true);
  });
});
