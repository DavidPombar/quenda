// SPDX-License-Identifier: AGPL-3.0-or-later
import { TariffResolver } from "../../../tariffs/application/tariff-resolver";
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { BookingRepository } from "../../domain/booking.repository";
import { BookingUnitRepository } from "../../domain/booking-unit.repository";
import { FacilitySchedule } from "../../domain/facility-schedule";
import { NotificationRepository } from "../../domain/notification.repository";
import { Booking } from "../../domain/booking.entity";
import { Resource } from "../../../facilities/domain/resource.entity";
import { units } from "../../../facilities/domain/resource-units";
import { BookingPolicy, BookingPolicyError } from "../booking-policy";
import { ResourceChoiceError, chooseResource } from "../resource-choice";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Audit } from "../../../../shared/application/audit";
import {
  Outbox,
  queueBookingChange,
} from "../../../../shared/application/outbox";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type UpdateBookingError =
  | BookingPolicyError
  | ResourceChoiceError
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
    private readonly units: BookingUnitRepository,
    private readonly facilities: FacilitySchedule,
    private readonly municipalities: Municipalities,
    private readonly policy: BookingPolicy,
    private readonly tariffs: TariffResolver,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly notifications: NotificationRepository,
    private readonly audit: Audit,
    private readonly outbox: Outbox,
  ) {}
  /** Reschedules (new start and/or another resource of the same facility) or cancels. */
  async execute(args: {
    principal: Principal;
    id: string;
    start?: string;
    resourceId?: string;
    status?: "cancelled";
  }): Promise<Result<void, UpdateBookingError>> {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    await this.bookings.lockUser(tenantId, userId);
    const existing = await this.bookings.find(tenantId, userId, args.id);
    if (!existing) return Result.err(failure("not_found"));
    const reschedule =
      args.start !== undefined || args.resourceId !== undefined;
    if (!reschedule && !args.status) return Result.ok();
    if (reschedule && args.status) return Result.err(failure("validation"));
    if (args.status === "cancelled" && existing.status === "cancelled")
      return Result.ok();
    if (existing.status === "cancelled")
      return Result.err(failure("booking_cancelled"));
    const start = args.start ?? existing.start.toString();
    const resourceId = args.resourceId ?? existing.resourceId;
    if (
      reschedule &&
      start === existing.start.toString() &&
      resourceId === existing.resourceId
    )
      return Result.ok();
    const settings = await this.municipalities.find(tenantId);
    const facility = await this.facilities.lock(tenantId, existing.facilityId);
    const tariff = await this.tariffs.resolve(
      tenantId,
      userId,
      existing.facilityId,
    );
    if (!settings || !facility || !tariff)
      return Result.err(failure("not_found"));
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
    if (!reschedule) {
      const cancelled: Booking = {
        ...existing,
        status: "cancelled",
        cancelledAt: now,
        cancelledBy: "citizen",
        cancellationReason: null,
      };
      const rejected = (await this.bookings.save(cancelled)).fold(
        () => null,
        (error) => error,
      );
      if (rejected) return Result.err(rejected);
      await this.units.release(tenantId, existing.id);
      await this.notify(existing, "cancelled", now);
      await this.audit.record(
        args.principal,
        "booking.cancelled",
        existing.id,
        {
          facilityId: existing.facilityId,
          resourceId: existing.resourceId,
          start: existing.start.toString(),
          end: existing.end.toString(),
        },
      );
      return Result.ok();
    }
    // Only resources of the booking's own facility can be chosen.
    const resources = await this.facilities.resources(
      tenantId,
      existing.facilityId,
    );
    const choice = chooseResource(resources, resourceId).fold<
      { resource: Resource } | { error: ResourceChoiceError }
    >(
      (resource) => ({ resource }),
      (error) => ({ error }),
    );
    if ("error" in choice) return Result.err(choice.error);
    const validity = this.policy
      .validate({ start, facility, settings, now })
      .fold<
        | { start: Temporal.Instant; end: Temporal.Instant }
        | { error: BookingPolicyError }
      >(
        (interval) => interval,
        (error) => ({ error }),
      );
    if ("error" in validity) return Result.err(validity.error);
    const updated: Booking = {
      ...existing,
      resourceId: choice.resource.id,
      start: validity.start,
      end: validity.end,
      // A reschedule is a new change, so it takes the deadline now in force.
      cancellationHours: settings.cancellationHours,
      tariffCategory: tariff.category,
      priceCents: tariff.priceCents,
    };
    const rejected =
      (await this.bookings.save(updated)).fold(
        () => null,
        (e) => e,
      ) ??
      (
        await this.units.replace({
          tenantId,
          bookingId: updated.id,
          unitIds: units(choice.resource, resources),
          start: updated.start,
          end: updated.end,
        })
      ).fold(
        () => null,
        (e) => e,
      );
    if (rejected) return Result.err(rejected);
    await this.notify(existing, "rescheduled", now);
    await this.audit.record(
      args.principal,
      "booking.rescheduled",
      existing.id,
      {
        from: {
          start: existing.start.toString(),
          end: existing.end.toString(),
          resourceId: existing.resourceId,
        },
        to: {
          start: updated.start.toString(),
          end: updated.end.toString(),
          resourceId: updated.resourceId,
        },
      },
    );
    return Result.ok();
  }
  private async notify(
    booking: Booking,
    kind: "rescheduled" | "cancelled",
    now: Temporal.Instant,
  ) {
    const notificationId = this.ids.next();
    await this.notifications.add({
      id: notificationId,
      tenantId: booking.tenantId,
      userId: booking.userId,
      bookingId: booking.id,
      kind,
      createdAt: now,
    });
    await queueBookingChange(this.outbox, {
      newId: () => this.ids.next(),
      tenantId: booking.tenantId,
      userId: booking.userId,
      bookingId: booking.id,
      kind,
      notificationId,
      createdAt: now,
    });
  }
}
