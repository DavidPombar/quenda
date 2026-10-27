// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { BookingRepository } from "../../domain/booking.repository";
import { bookingOutcome } from "../../domain/booking-outcome";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
@Injectable()
export class ListBookings {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: { principal: Principal }) {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    const now = this.clock.now();
    return Result.ok(
      (
        await this.bookings.list(args.principal.tenantId, args.principal.userId)
      ).map((row) => ({ ...row, outcome: bookingOutcome(row.booking, now) })),
    );
  }
}
