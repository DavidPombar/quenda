// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Database } from "../../../../shared/infrastructure/database";
import { Resource } from "../../../facilities/domain/resource.entity";
import {
  FacilitySchedule,
  FacilityScheduleData,
} from "../../domain/facility-schedule";
@Injectable()
export class PostgresFacilitySchedule extends FacilitySchedule {
  constructor(private readonly db: Database) {
    super();
  }
  async lock(tenantId: string, id: string) {
    return (
      (
        await this.db.query<FacilityScheduleData>(
          'SELECT id,status,slot_minutes AS "slotMinutes",opening_calendar AS "openingCalendar",follows_municipal_holidays AS "followsMunicipalHolidays" FROM facilities WHERE tenant_id=$1 AND id=$2 FOR UPDATE',
          [tenantId, id],
        )
      ).rows[0] ?? null
    );
  }
  async resources(tenantId: string, facilityId: string) {
    return (
      await this.db.query<Resource>(
        'SELECT id, tenant_id AS "tenantId", facility_id AS "facilityId", name, position, parent_id AS "parentId", active FROM resources WHERE tenant_id=$1 AND facility_id=$2 ORDER BY position, name',
        [tenantId, facilityId],
      )
    ).rows;
  }
}
