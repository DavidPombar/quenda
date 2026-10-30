// SPDX-License-Identifier: AGPL-3.0-or-later
/** Code of a sport in a municipality's catalogue. */
export type Sport = string;
/** Illustration and colour of a sport; sports without their own use the generic ones. */
export type SportArt = "padel" | "tennis" | "futsal" | "swimming" | "generic";
/** A sport to filter the search by. */
export interface SportOption {
  code: string;
  name: { gl: string; es: string };
  art: SportArt;
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
  sportName: { gl: string; es: string };
  sportArt: SportArt;
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
