// SPDX-License-Identifier: AGPL-3.0-or-later
/** Code from a municipality's sports catalogue (#26). */
export type Sport = string;
export interface Localized {
  gl: string;
  es: string;
}
export interface SportInfo {
  code: Sport;
  name: Localized;
}
export interface MunicipalitySummary {
  id: string;
  slug: string;
  name: string;
}
export interface CatalogEntry {
  id: string;
  name: string;
  sport: Sport;
  sportName: Localized;
  address: string;
  description: string;
  accessible: boolean;
  slotMinutes: number;
  priceCents: number;
  municipality: { slug: string; name: string };
}
export interface CatalogPage {
  items: CatalogEntry[];
  total: number;
  page: number;
  pageSize: number;
}
export interface CatalogFilters {
  q: string;
  sport: Sport | "";
  accessible: boolean;
  municipalities: string[];
  page: number;
}
