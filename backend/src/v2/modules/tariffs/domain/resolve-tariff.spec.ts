// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { resolveTariff } from "./resolve-tariff";
import type { Category } from "../../../shared/application/categories";
const prices = [
  { category: "resident", priceCents: 300 },
  { category: "family", priceCents: 800 },
  { category: "minor", priceCents: 150 },
  { category: "senior", priceCents: 200 },
] as const;
const enabled: Category[] = ["resident", "family", "minor", "senior"];
function resolve(
  verified: Category[],
  overrides: Partial<Parameters<typeof resolveTariff>[0]> = {},
) {
  return resolveTariff({
    generalPriceCents: 500,
    prices,
    enabled,
    verified,
    prefersFamily: false,
    ...overrides,
  });
}
describe("resolveTariff", () => {
  it("charges the general price without verified categories", () => {
    expect(resolve([])).toEqual({ category: "general", priceCents: 500 });
  });
  it("applies a verified category's price", () => {
    expect(resolve(["resident"])).toEqual({
      category: "resident",
      priceCents: 300,
    });
  });
  it("applies the lowest price among several verified categories", () => {
    expect(resolve(["resident", "senior", "minor"])).toEqual({
      category: "minor",
      priceCents: 150,
    });
  });
  it("ignores categories the municipality does not offer", () => {
    expect(resolve(["minor"], { enabled: ["resident"] })).toEqual({
      category: "general",
      priceCents: 500,
    });
  });
  it("ignores verified categories the facility does not price", () => {
    expect(resolve(["disability"])).toEqual({
      category: "general",
      priceCents: 500,
    });
  });
  it("keeps the general price when a category costs more", () => {
    expect(
      resolve(["resident"], {
        prices: [{ category: "resident", priceCents: 700 }],
      }),
    ).toEqual({ category: "general", priceCents: 500 });
  });
  it("never picks the family tariff on its own", () => {
    expect(
      resolve(["family"], {
        prices: [{ category: "family", priceCents: 100 }],
      }),
    ).toEqual({ category: "general", priceCents: 500 });
  });
  it("applies the family tariff when the person opts for it", () => {
    expect(resolve(["family", "minor"], { prefersFamily: true })).toEqual({
      category: "family",
      priceCents: 800,
    });
  });
  it("falls back to the lowest price when the family tariff is not verified", () => {
    expect(resolve(["resident"], { prefersFamily: true })).toEqual({
      category: "resident",
      priceCents: 300,
    });
  });
});
