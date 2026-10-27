// SPDX-License-Identifier: AGPL-3.0-or-later
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])$/;
/** "Concello de A Pobra do Caramiñal" → "a-pobra-do-caraminal". */
export function suggestSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(
      /^\s*(concello|ayuntamiento|municipio)\s+(de|da|do|das|dos)\s+/,
      "",
    )
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/, "");
}
