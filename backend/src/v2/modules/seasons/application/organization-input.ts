// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Sport } from "../domain/season.read-model";
export interface OrganizationInput {
  name: string;
  taxId?: string | null;
  sport?: Sport | null;
  contactEmail?: string | null;
}
/** Trims the optional fields and turns empty ones into null. */
export function cleanOrganization(input: OrganizationInput) {
  const optional = (value: string | null | undefined) =>
    value?.trim() ? value.trim() : null;
  return {
    name: input.name.trim(),
    taxId: optional(input.taxId)?.toUpperCase() ?? null,
    sport: input.sport ?? null,
    contactEmail: optional(input.contactEmail)?.toLowerCase() ?? null,
  };
}
