// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Sport } from "./sport.entity";
export type SportDraft = Omit<Sport, "position">;
export type SportPlanError =
  { code: "validation" } | { code: "sport_in_use"; sportCode: string };
export interface SportPlan {
  /** Every requested sport with its position in the requested order. */
  save: Sport[];
  remove: string[];
}
const CODE = /^[a-z0-9-]{2,40}$/;
const SCHEMA_TYPE = /^[A-Z][A-Za-z]+$/;
const clean = (value: string) => value.trim();
const distinct = (values: string[]) =>
  new Set(values.map((value) => value.toLocaleLowerCase())).size ===
  values.length;
/**
 * Checks a municipality's complete new sports catalogue (#26). Codes and names are unique, at
 * least one sport stays visible, and a sport used by a facility cannot be removed, only hidden.
 */
export function planSports(
  current: readonly Sport[],
  requested: readonly SportDraft[],
  usedCodes: readonly string[],
): { plan: SportPlan } | { error: SportPlanError } {
  const names = (key: "nameGl" | "nameEs") =>
    requested.map((sport) => clean(sport[key]));
  if (
    !requested.length ||
    !requested.some((sport) => sport.visible) ||
    requested.some(
      (sport) =>
        !CODE.test(sport.code) ||
        !SCHEMA_TYPE.test(sport.schemaType) ||
        [sport.nameGl, sport.nameEs, sport.cnidClass, sport.cnidType].some(
          (text) => !clean(text) || clean(text).length > 80,
        ),
    ) ||
    !distinct(requested.map((sport) => sport.code)) ||
    !distinct(names("nameGl")) ||
    !distinct(names("nameEs"))
  )
    return { error: { code: "validation" } };
  const kept = new Set(requested.map((sport) => sport.code));
  const used = current.find(
    (sport) => !kept.has(sport.code) && usedCodes.includes(sport.code),
  );
  if (used) return { error: { code: "sport_in_use", sportCode: used.code } };
  return {
    plan: {
      save: requested.map((sport, position) => ({
        ...sport,
        nameGl: clean(sport.nameGl),
        nameEs: clean(sport.nameEs),
        cnidClass: clean(sport.cnidClass),
        cnidType: clean(sport.cnidType),
        position,
      })),
      remove: current
        .filter((sport) => !kept.has(sport.code))
        .map((sport) => sport.code),
    },
  };
}
