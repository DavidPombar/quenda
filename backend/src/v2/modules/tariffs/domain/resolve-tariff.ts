// SPDX-License-Identifier: AGPL-3.0-or-later
import type {
  Category,
  CategoryPrice,
  TariffCategory,
} from "../../../shared/application/categories";
export interface Tariff {
  category: TariffCategory;
  priceCents: number;
}
/**
 * The cheapest tariff among the person's verified categories that the municipality offers and
 * the facility prices; the general price otherwise, and on ties. The family tariff (at least three
 * members) is never chosen automatically: it applies only when the person opts for it.
 */
export function resolveTariff(args: {
  generalPriceCents: number;
  prices: readonly CategoryPrice[];
  enabled: readonly Category[];
  verified: readonly Category[];
  prefersFamily: boolean;
}): Tariff {
  const eligible = args.prices.filter(
    (price) =>
      args.enabled.includes(price.category) &&
      args.verified.includes(price.category),
  );
  const family = eligible.find((price) => price.category === "family");
  if (args.prefersFamily && family) return family;
  return eligible
    .filter((price) => price.category !== "family")
    .reduce<Tariff>(
      (best, price) => (price.priceCents < best.priceCents ? price : best),
      { category: "general", priceCents: args.generalPriceCents },
    );
}
