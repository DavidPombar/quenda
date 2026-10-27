// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { BookingRepository } from "../../domain/booking.repository";
import { ManagedBookingReadModel } from "../../domain/booking.read-model";
import { BookingOutcome } from "../../domain/booking.entity";
import { bookingOutcome } from "../../domain/booking-outcome";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type ListManagedBookingsError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">;
export interface ManagedBooking extends ManagedBookingReadModel {
  outcome: BookingOutcome;
  checkedInAt: Temporal.Instant | null;
  canMarkNoShow: boolean;
  canRevert: boolean;
  canCancel: boolean;
}
/**
 * Reservations of one local day, for attendance and municipal cancellations. Door staff (M3) only
 * see today and cannot cancel.
 */
@Injectable()
export class ListManagedBookings {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    principal: Principal;
    date: string;
    facilityId?: string;
  }): Promise<Result<ManagedBooking[], ListManagedBookingsError>> {
    const manages = can(args.principal, "bookings:manage");
    if (!manages && !can(args.principal, "bookings:attendance"))
      return Result.err(failure("forbidden"));
    const settings = await this.municipalities.find(args.principal.tenantId);
    if (!settings) return Result.err(failure("not_found"));
    let date: Temporal.PlainDate;
    try {
      date = Temporal.PlainDate.from(args.date, { overflow: "reject" });
    } catch {
      return Result.err(failure("validation"));
    }
    const now = this.clock.now();
    const today = now.toZonedDateTimeISO(settings.timezone).toPlainDate();
    if (!manages && !date.equals(today))
      return Result.err(failure("forbidden"));
    const rows = await this.bookings.listStarting({
      tenantId: settings.id,
      from: date.toZonedDateTime(settings.timezone).toInstant(),
      to: date.add({ days: 1 }).toZonedDateTime(settings.timezone).toInstant(),
      facilityId: args.facilityId,
    });
    return Result.ok(
      rows.map((row) => {
        const started = Temporal.Instant.compare(row.booking.start, now) <= 0;
        const checkedInAt =
          row.booking.status === "confirmed"
            ? (row.booking.checkedInAt ?? null)
            : null;
        return {
          ...row,
          outcome: bookingOutcome(row.booking, now),
          checkedInAt,
          canMarkNoShow:
            row.booking.status === "confirmed" &&
            !checkedInAt &&
            started &&
            date.equals(today),
          canRevert: row.booking.status === "no_show",
          canCancel: manages && row.booking.status === "confirmed" && !started,
        };
      }),
    );
  }
}
