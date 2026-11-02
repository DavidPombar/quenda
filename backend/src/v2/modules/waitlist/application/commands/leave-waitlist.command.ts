// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { BookingRepository } from "../../../bookings/domain/booking.repository";
import { BookingUnitRepository } from "../../../bookings/domain/booking-unit.repository";
import { WaitlistRepository } from "../../domain/waitlist.repository";
import { WaitlistMatcher } from "../waitlist-matcher";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Leaves a waiting list; a place held for the person goes to the next one at once. */
@Injectable()
export class LeaveWaitlist {
  constructor(
    private readonly entries: WaitlistRepository,
    private readonly bookings: BookingRepository,
    private readonly units: BookingUnitRepository,
    private readonly matcher: WaitlistMatcher,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
  }): Promise<Result<void, AppError<"forbidden"> | AppError<"not_found">>> {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    await this.bookings.lockUser(tenantId, userId);
    const found = await this.entries.find(tenantId, args.id);
    if (!found || found.userId !== userId)
      return Result.err(failure("not_found"));
    const left = await this.entries.end(tenantId, found.id, "left");
    // Leaving twice, or after the offer ended, changes nothing.
    if (!left) return Result.ok();
    if (left.status === "offered") {
      await this.units.releaseHold(tenantId, left.id);
      await this.matcher.passOn(left, this.clock.now());
    }
    await this.audit.record(args.principal, "waitlist.left", left.id, {
      facilityId: left.facilityId,
      start: left.start.toString(),
    });
    return Result.ok();
  }
}
