// SPDX-License-Identifier: AGPL-3.0-or-later
export interface FacilityUsage {
  id: string;
  name: string;
  openingCalendar: string;
  status: string;
  bookings: number;
  cancelled: number;
  /** Occupied unit-minutes within the period: a whole-court booking counts once per part. */
  minutes: number;
  /** Active units (resources without parts) that multiply the opening minutes. */
  units: number;
}
export abstract class InsightsRepository {
  abstract usage(
    tenantId: string,
    from: string,
    to: string,
  ): Promise<FacilityUsage[]>;
}
