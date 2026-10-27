// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
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
import { Outbox } from "../../../../shared/application/outbox";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type UpdateBookingError =
  | BookingPolicyError
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"cancellation_deadline">
  | AppError<"booking_cancelled">
  | AppError<"slot_taken">
  | AppError<"id_reused">;
@Injectable()
export class UpdateBooking {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly facilities: FacilitySchedule,
    private readonly municipalities: Municipalities,
    private readonly policy: BookingPolicy,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly notifications: NotificationRepository,
    private readonly audit: Audit,
    private readonly outbox: Outbox,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    start?: string;
    status?: "cancelled";
  }): Promise<Result<void, UpdateBookingError>> {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    await this.bookings.lockUser(tenantId, userId);
    const existing = await this.bookings.find(tenantId, userId, args.id);
    if (!existing) return Result.err(failure("not_found"));
    if (!args.start && !args.status) return Result.ok();
    if (args.start && args.status) return Result.err(failure("validation"));
    if (args.status === "cancelled" && existing.status === "cancelled")
      return Result.ok();
    if (existing.status === "cancelled")
      return Result.err(failure("booking_cancelled"));
    if (args.start === existing.start.toString()) return Result.ok();
    const settings = await this.municipalities.find(tenantId);
    const facility = await this.facilities.lock(tenantId, existing.facilityId);
    if (!settings || !facility) return Result.err(failure("not_found"));
    const now = this.clock.now();
    if (
      Temporal.Instant.compare(
        now.add({
          hours: existing.cancellationHours ?? settings.cancellationHours,
        }),
        existing.start,
      ) > 0
    )
      return Result.err(failure("cancellation_deadline"));
    let updated: Booking = {
      ...existing,
      status: "cancelled",
      cancelledAt: now,
      cancelledBy: "citizen",
      cancellationReason: null,
    };
    if (args.start) {
      const validity = this.policy.validate({
        start: args.start,
        facility,
        settings,
        now,
      });
      if (validity.isFailure)
        return validity.fold<Result<void, UpdateBookingError>>(
          () => Result.ok(),
          (error) => Result.err(error),
        );
      updated = validity.fold(
        // A reschedule is a new change, so it takes the deadline now in force.
        (interval) => ({
          ...existing,
          ...interval,
          cancellationHours: settings.cancellationHours,
        }),
        () => existing,
      );
    }
    const saved = await this.bookings.save(updated);
    if (saved.isFailure) return saved;
    const notificationId = this.ids.next();
    const kind = args.start ? "rescheduled" : "cancelled";
    await this.notifications.add({
      id: notificationId,
      tenantId,
      userId,
      bookingId: existing.id,
      kind,
      createdAt: now,
    });
    await this.outbox.enqueue({
      id: this.ids.next(),
      tenantId,
      userId,
      bookingId: existing.id,
      kind,
      channel: "email",
      dedupeKey: `${kind}:${notificationId}`,
      createdAt: now,
    });
    if (args.start)
      await this.audit.record(
        args.principal,
        "booking.rescheduled",
        existing.id,
        {
          from: {
            start: existing.start.toString(),
            end: existing.end.toString(),
          },
          to: { start: updated.start.toString(), end: updated.end.toString() },
        },
      );
    else
      await this.audit.record(
        args.principal,
        "booking.cancelled",
        existing.id,
        {
          facilityId: existing.facilityId,
          start: existing.start.toString(),
          end: existing.end.toString(),
        },
      );
    return Result.ok();
  }
}
