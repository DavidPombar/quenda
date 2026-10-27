// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { BookingRepository } from "../../domain/booking.repository";
import { ManageBooking } from "./manage-booking.command";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type MarkUncheckedNoShowsError =
  AppError<"forbidden"> | AppError<"not_found">;
/**
 * After the door shift (M3, C3): today's started bookings that nobody scanned become no-shows in
 * one step, each with the same penalty, notice and audit as marking it by hand.
 */
@Injectable()
export class MarkUncheckedNoShows {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly municipalities: Municipalities,
    private readonly manage: ManageBooking,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    principal: Principal;
    facilityId?: string;
  }): Promise<Result<{ marked: number }, MarkUncheckedNoShowsError>> {
    if (!can(args.principal, "bookings:attendance"))
      return Result.err(failure("forbidden"));
    const settings = await this.municipalities.find(args.principal.tenantId);
    if (!settings) return Result.err(failure("not_found"));
    const now = this.clock.now();
    const today = now.toZonedDateTimeISO(settings.timezone).toPlainDate();
    const rows = await this.bookings.listStarting({
      tenantId: settings.id,
      from: today.toZonedDateTime(settings.timezone).toInstant(),
      to: now.add({ nanoseconds: 1 }),
      facilityId: args.facilityId,
    });
    let marked = 0;
    for (const { booking } of rows) {
      if (
        booking.status !== "confirmed" ||
        booking.checkedInAt ||
        Temporal.Instant.compare(booking.start, now) > 0
      )
        continue;
      const result = await this.manage.execute({
        principal: args.principal,
        id: booking.id,
        change: { attendance: "no_show" },
      });
      if (!result.isFailure) marked++;
    }
    return Result.ok({ marked });
  }
}
