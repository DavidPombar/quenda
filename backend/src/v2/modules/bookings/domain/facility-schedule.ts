// SPDX-License-Identifier: AGPL-3.0-or-later
export interface FacilityScheduleData {
  id: string;
  status: string;
  slotMinutes: number;
  openingCalendar: string;
  followsMunicipalHolidays: boolean;
}
/** Consumer-owned port; locking serializes reservations with schedule edits. */
export abstract class FacilitySchedule {
  abstract lock(
    tenantId: string,
    id: string,
  ): Promise<FacilityScheduleData | null>;
}
