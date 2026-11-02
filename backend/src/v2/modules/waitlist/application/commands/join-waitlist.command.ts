// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { BookingRepository } from "../../../bookings/domain/booking.repository";
import { BookingBlockRepository } from "../../../bookings/domain/booking-block.repository";
import { BookingUnitRepository } from "../../../bookings/domain/booking-unit.repository";
import { FacilitySchedule } from "../../../bookings/domain/facility-schedule";
import {
  BookingPolicy,
  BookingPolicyError,
} from "../../../bookings/application/booking-policy";
import {
  ResourceChoiceError,
  chooseResource,
} from "../../../bookings/application/resource-choice";
import { placeOf } from "../../../bookings/application/commands/create-booking.command";
import { Resource } from "../../../facilities/domain/resource.entity";
import { WaitlistRepository } from "../../domain/waitlist.repository";
import { WaitlistEntry } from "../../domain/waitlist-entry.entity";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type JoinWaitlistError =
  | BookingPolicyError
  | ResourceChoiceError
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"waitlist_disabled">
  | AppError<"waitlist_limit">
  | AppError<"booking_blocked">
  | AppError<"booking_limit">
  | AppError<"slot_available">
  | AppError<"already_booked">
  | AppError<"already_waiting">
  | AppError<"id_reused">;
/**
 * Joins the waiting list of a full slot (#96). Only someone who could book it now may wait:
 * within the advance window, not blocked for no-shows and below the active-booking limit.
 */
@Injectable()
export class JoinWaitlist {
  constructor(
    private readonly entries: WaitlistRepository,
    private readonly bookings: BookingRepository,
    private readonly blocks: BookingBlockRepository,
    private readonly units: BookingUnitRepository,
    private readonly facilities: FacilitySchedule,
    private readonly municipalities: Municipalities,
    private readonly policy: BookingPolicy,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    facilityId: string;
    resourceId?: string;
    start: string;
  }): Promise<Result<WaitlistEntry, JoinWaitlistError>> {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    await this.bookings.lockUser(tenantId, userId);
    let requestedStart: Temporal.Instant;
    try {
      requestedStart = Temporal.Instant.from(args.start);
    } catch {
      return Result.err(failure("validation"));
    }
    const existing = await this.entries.find(tenantId, args.id);
    if (existing)
      return existing.userId === userId &&
        existing.facilityId === args.facilityId &&
        (args.resourceId === undefined ||
          existing.resourceId === args.resourceId) &&
        existing.start.equals(requestedStart)
        ? Result.ok(existing)
        : Result.err(failure("id_reused"));
    const settings = await this.municipalities.find(tenantId);
    if (!settings) return Result.err(failure("not_found"));
    if (settings.waitlistMaxEntries === 0)
      return Result.err(failure("waitlist_disabled"));
    const facility = await this.facilities.lock(tenantId, args.facilityId);
    if (!facility) return Result.err(failure("not_found"));
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
    const validity = this.policy
      .validate({ start: args.start, facility, settings, now })
      .fold<
        | { start: Temporal.Instant; end: Temporal.Instant }
        | { error: BookingPolicyError }
      >(
        (interval) => interval,
        (error) => ({ error }),
      );
    if ("error" in validity) return Result.err(validity.error);
    const slot = { tenantId, resourceId: resource.id, userId, ...validity };
    if (await this.entries.findOpen(slot))
      return Result.err(failure("already_waiting"));
    if (await this.entries.hasBooking(slot))
      return Result.err(failure("already_booked"));
    const vacancy = await this.units.vacancy({
      tenantId,
      ...placeOf(resource, resources, userId),
      ...validity,
    });
    if (vacancy === "mine") return Result.err(failure("already_booked"));
    if (vacancy === "free") return Result.err(failure("slot_available"));
    if (
      (await this.entries.countOpen(tenantId, userId)) >=
      settings.waitlistMaxEntries
    )
      return Result.err(failure("waitlist_limit"));
    const entry: WaitlistEntry = {
      id: args.id,
      tenantId,
      userId,
      facilityId: args.facilityId,
      resourceId: resource.id,
      ...validity,
      createdAt: now,
      status: "waiting",
      offeredAt: null,
      offerExpiresAt: null,
    };
    await this.entries.add(entry);
    await this.audit.record(args.principal, "waitlist.joined", entry.id, {
      facilityId: entry.facilityId,
      resourceId: entry.resourceId,
      start: entry.start.toString(),
      end: entry.end.toString(),
    });
    return Result.ok(entry);
  }
}
