// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * A bookable court or space of a facility (M1). It inherits sport, price, slot length, opening
 * calendar and status from its facility; only `active` (in service) is its own.
 */
export interface Resource {
  id: string;
  tenantId: string;
  facilityId: string;
  name: string;
  position: number;
  /** Composite resource this one is a part of; parts cannot have parts. */
  parentId: string | null;
  active: boolean;
}
