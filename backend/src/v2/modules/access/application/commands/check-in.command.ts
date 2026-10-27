// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import {
  AccessBooking,
  AccessBookingRepository,
} from "../../domain/access-booking.repository";
import { CredentialKeys } from "../../domain/credential-keys";
import { checkWindow, toEpochSeconds } from "../../domain/access-credential";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type CheckInError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"validation">
  | AppError<"invalid_credential">
  | AppError<"credential_not_yet_valid">
  | AppError<"credential_expired">
  | AppError<"booking_cancelled">
  | AppError<"marked_no_show">;
export interface CheckInResult {
  booking: AccessBooking;
  checkedInAt: Temporal.Instant;
  alreadyCheckedIn: boolean;
}
/** Phones may queue scans made without a connection for this long. */
const offlineHours = 24;
/**
 * A door scan (M3, C3). The server checks again what the phone checked offline (signature,
 * municipality, window) and also what only it knows: the booking still exists unchanged.
 */
@Injectable()
export class CheckIn {
  constructor(
    private readonly bookings: AccessBookingRepository,
    private readonly keys: CredentialKeys,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    token: string;
    /** When the scan happened, for scans queued offline; defaults to now. */
    scannedAt?: string;
  }): Promise<Result<CheckInResult, CheckInError>> {
    if (!can(args.principal, "access:validate"))
      return Result.err(failure("forbidden"));
    const settings = await this.municipalities.find(args.principal.tenantId);
    if (!settings) return Result.err(failure("not_found"));
    const now = this.clock.now();
    let at = now;
    if (args.scannedAt) {
      try {
        at = Temporal.Instant.from(args.scannedAt);
      } catch {
        return Result.err(failure("validation"));
      }
      if (
        Temporal.Instant.compare(at, now.add({ minutes: 5 })) > 0 ||
        Temporal.Instant.compare(at, now.subtract({ hours: offlineHours })) < 0
      )
        return Result.err(failure("validation"));
      if (Temporal.Instant.compare(at, now) > 0) at = now;
    }
    const claims = await this.keys.verify(settings.id, args.token);
    if (!claims || claims.iss !== settings.slug)
      return Result.err(failure("invalid_credential"));
    const booking = await this.bookings.find(settings.id, claims.sub, true);
    // A rescheduled booking changes its end, so credentials issued before no longer match.
    if (
      !booking ||
      booking.facilityId !== claims.fac ||
      toEpochSeconds(booking.end) !== claims.exp
    )
      return Result.err(failure("invalid_credential"));
    const window = checkWindow(claims, at);
    if (window === "not_yet_valid")
      return Result.err(failure("credential_not_yet_valid"));
    if (window === "expired") return Result.err(failure("credential_expired"));
    if (booking.status === "cancelled")
      return Result.err(failure("booking_cancelled"));
    if (booking.status === "no_show")
      return Result.err(failure("marked_no_show"));
    if (booking.checkedInAt)
      return Result.ok({
        booking,
        checkedInAt: booking.checkedInAt,
        alreadyCheckedIn: true,
      });
    await this.bookings.checkIn({
      tenantId: settings.id,
      id: booking.id,
      at,
      by: args.principal.userId,
    });
    await this.audit.record(args.principal, "booking.checked_in", booking.id, {
      facilityId: booking.facilityId,
      start: booking.start.toString(),
      scannedAt: at.toString(),
      queued: args.scannedAt !== undefined,
    });
    return Result.ok({ booking, checkedInAt: at, alreadyCheckedIn: false });
  }
}
