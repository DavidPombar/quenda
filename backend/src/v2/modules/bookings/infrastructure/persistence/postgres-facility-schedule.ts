// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Database } from "../../../../shared/infrastructure/database";
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
          'SELECT id,status,slot_minutes AS "slotMinutes",opening_calendar AS "openingCalendar" FROM facilities WHERE tenant_id=$1 AND id=$2 FOR UPDATE',
          [tenantId, id],
        )
      ).rows[0] ?? null
    );
  }
}
