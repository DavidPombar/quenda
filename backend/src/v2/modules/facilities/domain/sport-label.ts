// SPDX-License-Identifier: AGPL-3.0-or-later
import type { SportLabel } from "./facility.read-model";
import type { Sport } from "./sport.entity";
/** The label shown for a facility's sport; the code stands in if the sport is missing. */
export function sportLabel(sport: Sport | null, code: string): SportLabel {
  return sport
    ? { sportName: { gl: sport.nameGl, es: sport.nameEs }, sportArt: sport.art }
    : { sportName: { gl: code, es: code }, sportArt: "generic" };
}
