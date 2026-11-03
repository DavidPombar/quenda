// SPDX-License-Identifier: AGPL-3.0-or-later
/** A trimmed first name and a plausible year of birth, or null. */
export function cleanDependantInput(
  input: { firstName: string; birthYear: number },
  currentYear: number,
): { firstName: string; birthYear: number } | null {
  const firstName = input.firstName.trim().replace(/\s+/g, " ");
  if (firstName.length < 1 || firstName.length > 60) return null;
  if (
    !Number.isInteger(input.birthYear) ||
    input.birthYear < currentYear - 120 ||
    input.birthYear > currentYear
  )
    return null;
  return { firstName, birthYear: input.birthYear };
}
