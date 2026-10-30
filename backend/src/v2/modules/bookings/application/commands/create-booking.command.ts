// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import { TariffResolver } from "../../../tariffs/application/tariff-resolver";
import { Injectable } from "@nestjs/common";
import { BookingRepository } from "../../domain/booking.repository";
import { BookingUnitRepository } from "../../domain/booking-unit.repository";
import { FacilitySchedule } from "../../domain/facility-schedule";
import { NotificationRepository } from "../../domain/notification.repository";
import { BookingBlockRepository } from "../../domain/booking-block.repository";
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
export type CreateBookingError =
  | BookingPolicyError
  | ResourceChoiceError
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"booking_limit">
  | AppError<"booking_blocked">
  | AppError<"slot_taken">
  | AppError<"id_reused">;
@Injectable()
export class CreateBooking {
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
    private readonly blocks: BookingBlockRepository,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    facilityId: string;
    resourceId?: string;
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
    // A retry without resourceId accepts the resource chosen by the first request.
    if (existing)
      return existing.facilityId === args.facilityId &&
        (args.resourceId === undefined ||
          existing.resourceId === args.resourceId) &&
        existing.start.equals(requestedStart)
        ? Result.ok(existing)
        : Result.err(failure("id_reused"));
    const settings = await this.municipalities.find(tenantId);
    const facility = await this.facilities.lock(tenantId, args.facilityId);
    const tariff = await this.tariffs.resolve(
      tenantId,
      userId,
      args.facilityId,
    );
    if (!settings || !facility || !tariff)
      return Result.err(failure("not_found"));
    const resources = await this.facilities.resources(
      tenantId,
      args.facilityId,
    );
    const choice = chooseResource(resources, args.resourceId).fold<
      { resource: Resource } | { error: ResourceChoiceError }
    >(
      (resource) => ({ resource }),
      (error) => ({ error }),
    );
    if ("error" in choice) return Result.err(choice.error);
    const { resource } = choice;
    const now = this.clock.now();
    if (await this.blocks.active(tenantId, userId, now))
      return Result.err(failure("booking_blocked"));
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
          resourceId: resource.id,
          ...interval,
          status: "confirmed",
          createdAt: now,
          cancellationHours: settings.cancellationHours,
          tariffCategory: tariff.category,
          priceCents: tariff.priceCents,
        };
        const rejected =
          (await this.bookings.save(booking)).fold(
            () => null,
            (e) => e,
          ) ??
          (
            await this.units.replace({
              tenantId,
              bookingId: booking.id,
              unitIds: units(resource, resources),
              start: booking.start,
              end: booking.end,
            })
          ).fold(
            () => null,
            (e) => e,
          );
        if (rejected) return Result.err(rejected);
        const notificationId = this.ids.next();
        await this.notifications.add({
          id: notificationId,
          tenantId,
          userId,
          bookingId: booking.id,
          kind: "confirmed",
          createdAt: now,
        });
        await queueBookingChange(this.outbox, {
          newId: () => this.ids.next(),
          tenantId,
          userId,
          bookingId: booking.id,
          kind: "confirmed",
          notificationId,
          createdAt: now,
        });
        await this.audit.record(args.principal, "booking.created", booking.id, {
          facilityId: booking.facilityId,
          resourceId: booking.resourceId,
          tariff,
          start: booking.start.toString(),
          end: booking.end.toString(),
        });
        return Result.ok(booking);
      },
      async (error) => Result.err(error),
    );
  }
}
