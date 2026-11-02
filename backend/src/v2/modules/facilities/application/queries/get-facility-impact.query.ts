// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { FacilityRepository } from "../../domain/facility.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export interface FacilityImpact {
  bookings: number;
  people: number;
  /** Sessions of the facility's activities (#97) a closure would cancel. */
  sessions: number;
}
/** What closing the facility now would cancel, for the confirmation screen. */
@Injectable()
export class GetFacilityImpact {
  constructor(
    private readonly facilities: FacilityRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
  }): Promise<
    Result<FacilityImpact, AppError<"forbidden"> | AppError<"not_found">>
  > {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    if (!(await this.facilities.find(tenantId, args.id)))
      return Result.err(failure("not_found"));
    const now = this.clock.now();
    const upcoming = await this.facilities.upcomingBookings(
      tenantId,
      args.id,
      now,
    );
    return Result.ok({
      bookings: upcoming.length,
      people: new Set(upcoming.map((booking) => booking.userId)).size,
      sessions: await this.facilities.upcomingActivitySessions(
        tenantId,
        args.id,
        now,
      ),
    });
  }
}
