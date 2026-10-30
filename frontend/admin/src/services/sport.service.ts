// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Locale, SportName } from "@/types/models";
/** A sport's name in the interface language; the code stands in while it is unknown. */
export function sportLabel(
  name: SportName | undefined,
  code: string,
  locale: Locale,
) {
  return name?.[locale] || code;
}
