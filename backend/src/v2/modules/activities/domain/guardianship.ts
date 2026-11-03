// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Version of the declaration an adult accepts when adding a person in their care: that they hold
 * parental authority or guardianship (art. 7 LOPDGDD). The text lives in the apps; a new wording
 * gets a new version so each record says which one was accepted.
 */
export const GUARDIANSHIP_DECLARATION_VERSION = "2026-11";
/** People an adult can keep in their care. */
export const MAX_DEPENDANTS = 10;
/** Age in the year an activity starts, as its age limits are meant (#97). */
export function ageInYear(birthYear: number, year: number) {
  return year - birthYear;
}
/** Whether an age fits an activity's limits; a missing limit does not restrict. */
export function fitsAges(
  age: number,
  limits: { minAge: number | null; maxAge: number | null },
) {
  return (
    (limits.minAge === null || age >= limits.minAge) &&
    (limits.maxAge === null || age <= limits.maxAge)
  );
}
