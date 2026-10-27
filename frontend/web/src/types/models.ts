// SPDX-License-Identifier: AGPL-3.0-or-later
export type Sport = "padel" | "tennis" | "futsal" | "swimming";
export interface MunicipalitySummary {
  id: string;
  slug: string;
  name: string;
}
export interface CatalogEntry {
  id: string;
  name: string;
  sport: Sport;
  address: string;
  description: string;
  accessible: boolean;
  slotMinutes: number;
  priceCents: number;
  municipality: { slug: string; name: string };
}
export interface CatalogFilters {
  q: string;
  sport: Sport | "";
  accessible: boolean;
  municipalities: string[];
}
