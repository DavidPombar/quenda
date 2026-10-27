// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { BookingRepository } from "../../domain/booking.repository";
import { BookingBlockRepository } from "../../domain/booking-block.repository";
import { NotificationRepository } from "../../domain/notification.repository";
import { Booking } from "../../domain/booking.entity";
import {
  PenaltyStanding,
  blockEnd,
  penaltyStanding,
  reachesLimit,
  windowStart,
} from "../../domain/no-show-penalty";
import { Principal, can } from "../../../../shared/application/principal";
import {
  Municipalities,
  MunicipalitySettings,
} from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type ManageBookingError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"validation">
  | AppError<"attendance_window">
  | AppError<"cancellation_deadline">
  | AppError<"booking_cancelled">
  | AppError<"checked_in">;
export type ManageBookingChange =
  | { attendance: "no_show" | "attended" }
  | { status: "cancelled"; reason: string };
/**
 * Municipal actions on someone's reservation (C3, M3). A no-show can only be marked on the
 * booking's local day once it has started; afterwards the booking counts as attended and the
 * only correction allowed is reverting a no-show.
 */
@Injectable()
export class ManageBooking {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly blocks: BookingBlockRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly notifications: NotificationRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    change: ManageBookingChange;
  }): Promise<Result<void, ManageBookingError>> {
    // Door staff (M3) record attendance; only managers cancel on behalf of the municipality.
    if (
      !can(
        args.principal,
        "status" in args.change ? "bookings:manage" : "bookings:attendance",
      )
    )
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    const found = await this.bookings.findInTenant(tenantId, args.id);
    if (!found) return Result.err(failure("not_found"));
    await this.bookings.lockUser(tenantId, found.userId);
    const existing = await this.bookings.findInTenant(tenantId, args.id);
    const settings = await this.municipalities.find(tenantId);
    if (!existing || !settings) return Result.err(failure("not_found"));
    const now = this.clock.now();
    if ("status" in args.change) {
      const reason = args.change.reason.trim();
      if (!reason) return Result.err(failure("validation"));
      return this.cancel(args.principal, existing, reason, now);
    }
    return args.change.attendance === "no_show"
      ? this.markNoShow(args.principal, existing, settings, now)
      : this.revertNoShow(args.principal, existing, settings, now);
  }
  private async cancel(
    principal: Principal,
    existing: Booking,
    reason: string,
    now: Temporal.Instant,
  ): Promise<Result<void, ManageBookingError>> {
    if (existing.status === "cancelled")
      return existing.cancelledBy === "municipality"
        ? Result.ok()
        : Result.err(failure("booking_cancelled"));
    if (
      existing.status !== "confirmed" ||
      Temporal.Instant.compare(existing.start, now) <= 0
    )
      return Result.err(failure("cancellation_deadline"));
    await this.save({
      ...existing,
      status: "cancelled",
      cancelledAt: now,
      cancelledBy: "municipality",
      cancellationReason: reason,
    });
    await this.notifications.add({
      id: this.ids.next(),
      tenantId: existing.tenantId,
      userId: existing.userId,
      bookingId: existing.id,
      kind: "cancelled_by_municipality",
      createdAt: now,
      details: { reason },
    });
    await this.audit.record(
      principal,
      "booking.cancelled_by_municipality",
      existing.id,
      {
        facilityId: existing.facilityId,
        start: existing.start.toString(),
        end: existing.end.toString(),
        reason,
      },
    );
    return Result.ok();
  }
  private async markNoShow(
    principal: Principal,
    existing: Booking,
    settings: MunicipalitySettings,
    now: Temporal.Instant,
  ): Promise<Result<void, ManageBookingError>> {
    if (existing.status === "no_show") return Result.ok();
    if (existing.status === "cancelled")
      return Result.err(failure("booking_cancelled"));
    if (existing.checkedInAt) return Result.err(failure("checked_in"));
    const sameDay = existing.start
      .toZonedDateTimeISO(settings.timezone)
      .toPlainDate()
      .equals(now.toZonedDateTimeISO(settings.timezone).toPlainDate());
    if (!sameDay || Temporal.Instant.compare(existing.start, now) > 0)
      return Result.err(failure("attendance_window"));
    await this.save({ ...existing, status: "no_show" });
    let standing = await this.standing(existing.userId, settings, now);
    const blocked = reachesLimit(standing);
    if (blocked) {
      const end = blockEnd(settings, now);
      await this.blocks.add({
        id: this.ids.next(),
        tenantId: existing.tenantId,
        userId: existing.userId,
        bookingId: existing.id,
        start: now,
        end,
      });
      standing = { ...standing, blockedUntil: end };
    }
    await this.notifications.add({
      id: this.ids.next(),
      tenantId: existing.tenantId,
      userId: existing.userId,
      bookingId: existing.id,
      kind: "no_show",
      createdAt: now,
      details: { standing: snapshot(standing) },
    });
    await this.audit.record(principal, "booking.no_show", existing.id, {
      facilityId: existing.facilityId,
      start: existing.start.toString(),
      noShows: standing.count,
      limit: standing.limit,
    });
    if (blocked && standing.blockedUntil) {
      await this.notifications.add({
        id: this.ids.next(),
        tenantId: existing.tenantId,
        userId: existing.userId,
        bookingId: existing.id,
        kind: "blocked",
        createdAt: now,
        details: { standing: snapshot(standing) },
      });
      await this.audit.record(principal, "user.blocked", existing.userId, {
        bookingId: existing.id,
        until: standing.blockedUntil.toString(),
        noShows: standing.count,
      });
    }
    return Result.ok();
  }
  private async revertNoShow(
    principal: Principal,
    existing: Booking,
    settings: MunicipalitySettings,
    now: Temporal.Instant,
  ): Promise<Result<void, ManageBookingError>> {
    if (existing.status === "confirmed") return Result.ok();
    if (existing.status === "cancelled")
      return Result.err(failure("booking_cancelled"));
    await this.save({ ...existing, status: "confirmed" });
    await this.audit.record(
      principal,
      "booking.attendance_corrected",
      existing.id,
      { facilityId: existing.facilityId, start: existing.start.toString() },
    );
    // Lift a block this no-show contributed to: it started inside the window that led to it.
    const block = await this.blocks.active(
      existing.tenantId,
      existing.userId,
      now,
    );
    if (
      block &&
      Temporal.Instant.compare(existing.start, block.start) <= 0 &&
      Temporal.Instant.compare(
        existing.start,
        windowStart(settings, block.start),
      ) >= 0
    ) {
      await this.blocks.lift(existing.tenantId, block.id, now);
      const standing = await this.standing(existing.userId, settings, now);
      await this.notifications.add({
        id: this.ids.next(),
        tenantId: existing.tenantId,
        userId: existing.userId,
        bookingId: existing.id,
        kind: "unblocked",
        createdAt: now,
        details: { standing: snapshot(standing) },
      });
      await this.audit.record(principal, "user.unblocked", existing.userId, {
        bookingId: existing.id,
        blockId: block.id,
      });
    }
    return Result.ok();
  }
  private async save(booking: Booking) {
    // Status changes never move the slot, so overlap and ownership conflicts cannot happen.
    (await this.bookings.save(booking)).fold(
      () => undefined,
      (error) => {
        throw new Error(`Unexpected ${error.code} saving ${booking.id}`);
      },
    );
  }
  private async standing(
    userId: string,
    settings: MunicipalitySettings,
    now: Temporal.Instant,
  ): Promise<PenaltyStanding> {
    const block = await this.blocks.active(settings.id, userId, now);
    return penaltyStanding({
      noShowStarts: await this.bookings.noShowStarts(
        settings.id,
        userId,
        windowStart(settings, now),
      ),
      settings,
      now,
      blockedUntil: block?.end ?? null,
    });
  }
}
function snapshot(standing: PenaltyStanding) {
  return {
    count: standing.count,
    limit: standing.limit,
    windowDays: standing.windowDays,
    blockDays: standing.blockDays,
    remaining: standing.remaining,
    blockedUntil: standing.blockedUntil?.toString() ?? null,
  };
}
