// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Locale, Localized, SportInfo } from "@/types/models";
/** Text in the manager's language; an empty Spanish text shows the Galician one. */
export function localized(text: Localized, locale: Locale) {
  return (locale === "es" && text.es) || text.gl;
}
/** Name of a sport code in the municipality's catalogue (#26), or the code while it loads. */
export function sportLabel(
  code: string,
  sports: readonly SportInfo[],
  locale: Locale,
) {
  const sport = sports.find((value) => value.code === code);
  return sport ? localized(sport.name, locale) : code;
}
/**
 * Sports offered in a form: the visible ones, plus the current value when it is hidden, so an
 * existing facility or club keeps its sport.
 */
export function sportOptions(
  sports: readonly SportInfo[],
  locale: Locale,
  current?: string | null,
) {
  return sports
    .filter((sport) => !sport.hidden || sport.code === current)
    .map((sport) => ({
      value: sport.code,
      label: localized(sport.name, locale),
    }));
}

/** Lower-case code from a name: "Balonmán praia" → "balonman-praia". */
export function codeFrom(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
