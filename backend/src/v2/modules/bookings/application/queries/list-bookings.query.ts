// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { BookingRepository } from "../../domain/booking.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
@Injectable()
export class ListBookings {
  constructor(private readonly bookings: BookingRepository) {}
  async execute(args: { principal: Principal }) {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    return Result.ok(
      await this.bookings.list(args.principal.tenantId, args.principal.userId),
    );
  }
}
