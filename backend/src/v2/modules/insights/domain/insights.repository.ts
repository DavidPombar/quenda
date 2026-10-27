// SPDX-License-Identifier: AGPL-3.0-or-later
export interface FacilityUsage {
  id: string;
  name: string;
  openingCalendar: string;
  status: string;
  bookings: number;
  cancelled: number;
  noShows: number;
  minutes: number;
}
export abstract class InsightsRepository {
  abstract usage(
    tenantId: string,
    from: string,
    to: string,
  ): Promise<FacilityUsage[]>;
}
