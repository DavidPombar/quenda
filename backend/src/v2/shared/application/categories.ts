// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * User categories a municipality can price differently (M2). Everyone else pays the facility's
 * general tariff, so "not registered" is the absence of a verified category, not a category.
 */
export const CATEGORIES = [
  "resident",
  "family",
  "local_club",
  "minor",
  "large_family",
  "disability",
  "senior",
] as const;
export type Category = (typeof CATEGORIES)[number];
export type TariffCategory = Category | "general";
export interface CategoryPrice {
  category: Category;
  priceCents: number;
}
/** Deduplicated in catalogue order, so equal sets compare equal. */
export function normaliseCategories(values: readonly Category[]): Category[] {
  return CATEGORIES.filter((category) => values.includes(category));
}
