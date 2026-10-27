// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Resource } from "../../facilities/domain/resource.entity";
export interface FacilityScheduleData {
  id: string;
  status: string;
  slotMinutes: number;
  openingCalendar: string;
}
/** Consumer-owned port; locking serializes reservations with schedule edits. */
export abstract class FacilitySchedule {
  abstract lock(
    tenantId: string,
    id: string,
  ): Promise<FacilityScheduleData | null>;
  /** Resources of the facility in the same municipality, ordered by position and name. */
  abstract resources(tenantId: string, facilityId: string): Promise<Resource[]>;
}
