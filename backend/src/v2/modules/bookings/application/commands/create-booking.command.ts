// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import { Injectable } from "@nestjs/common";
import { BookingRepository } from "../../domain/booking.repository";
import { FacilitySchedule } from "../../domain/facility-schedule";
import { NotificationRepository } from "../../domain/notification.repository";
import { Booking } from "../../domain/booking.entity";
import { BookingPolicy, BookingPolicyError } from "../booking-policy";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type CreateBookingError =
  | BookingPolicyError
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"booking_limit">
  | AppError<"slot_taken">
  | AppError<"id_reused">;
@Injectable()
export class CreateBooking {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly facilities: FacilitySchedule,
    private readonly municipalities: Municipalities,
    private readonly policy: BookingPolicy,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly notifications: NotificationRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    facilityId: string;
    start: string;
  }): Promise<Result<Booking, CreateBookingError>> {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    await this.bookings.lockUser(tenantId, userId);
    const existing = await this.bookings.find(tenantId, userId, args.id);
    let requestedStart: Temporal.Instant;
    try {
      requestedStart = Temporal.Instant.from(args.start);
    } catch {
      return Result.err(failure("validation"));
    }
    if (existing)
      return existing.facilityId === args.facilityId &&
        existing.start.equals(requestedStart)
        ? Result.ok(existing)
        : Result.err(failure("id_reused"));
    const settings = await this.municipalities.find(tenantId);
    const facility = await this.facilities.lock(tenantId, args.facilityId);
    if (!settings || !facility) return Result.err(failure("not_found"));
    const now = this.clock.now();
    if (
      (await this.bookings.countActive(tenantId, userId, now)) >=
      settings.maxActiveBookings
    )
      return Result.err(failure("booking_limit"));
    const validity = this.policy.validate({
      start: args.start,
      facility,
      settings,
      now,
    });
    return validity.fold<Promise<Result<Booking, CreateBookingError>>>(
      async (interval) => {
        const booking: Booking = {
          id: args.id,
          tenantId,
          userId,
          facilityId: args.facilityId,
          ...interval,
          status: "confirmed",
          createdAt: now,
        };
        const saved = await this.bookings.save(booking);
        return saved.fold<Promise<Result<Booking, CreateBookingError>>>(
          async () => {
            await this.notifications.add({
              id: this.ids.next(),
              tenantId,
              userId,
              bookingId: booking.id,
              kind: "confirmed",
              createdAt: now,
            });
            await this.audit.record(
              args.principal,
              "booking.created",
              booking.id,
            );
            return Result.ok(booking);
          },
          async (error) => Result.err(error),
        );
      },
      async (error) => Result.err(error),
    );
  }
}
