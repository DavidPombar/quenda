// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { AccessRepository } from "../../domain/access.repository";
import { CheckInOutcome } from "../../domain/access.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
// Device clocks drift; a scan this far in the future is still accepted.
const CLOCK_SKEW_MINUTES = 5;
export interface CheckInRequest {
  bookingId: string;
  checkedInAt: string;
  method: "qr" | "manual";
}
/**
 * Records entries scanned at the door, possibly queued while the device was offline. Each item
 * gets its own outcome; recording twice is harmless.
 */
@Injectable()
export class RecordCheckIns {
  constructor(
    private readonly access: AccessRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    items: readonly CheckInRequest[];
  }): Promise<
    Result<
      { bookingId: string; outcome: CheckInOutcome }[],
      AppError<"forbidden"> | AppError<"validation"> | AppError<"not_found">
    >
  > {
    if (!can(args.principal, "access:control"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    const settings = await this.municipalities.find(tenantId);
    if (!settings) return Result.err(failure("not_found"));
    const now = this.clock.now();
    const results: { bookingId: string; outcome: CheckInOutcome }[] = [];
    for (const item of args.items) {
      let at: Temporal.Instant;
      try {
        at = Temporal.Instant.from(item.checkedInAt);
      } catch {
        return Result.err(failure("validation"));
      }
      results.push({
        bookingId: item.bookingId,
        outcome: await this.record(
          args.principal,
          item,
          at,
          now,
          settings.timezone,
        ),
      });
    }
    return Result.ok(results);
  }
  private async record(
    principal: Principal,
    item: CheckInRequest,
    at: Temporal.Instant,
    now: Temporal.Instant,
    timezone: string,
  ): Promise<CheckInOutcome> {
    const booking = await this.access.findForCheckIn(
      principal.tenantId,
      item.bookingId,
    );
    if (!booking) return "not_found";
    if (booking.status === "cancelled") return "cancelled";
    if (booking.status === "no_show") return "no_show";
    const day = (instant: Temporal.Instant) =>
      instant.toZonedDateTimeISO(timezone).toPlainDate();
    if (
      !day(at).equals(day(booking.start)) ||
      Temporal.Instant.compare(at, booking.end) > 0 ||
      Temporal.Instant.compare(at, now.add({ minutes: CLOCK_SKEW_MINUTES })) > 0
    )
      return "out_of_window";
    const inserted = await this.access.addCheckIn({
      id: this.ids.next(),
      tenantId: principal.tenantId,
      bookingId: item.bookingId,
      actorId: principal.userId,
      method: item.method,
      checkedInAt: at,
      recordedAt: now,
    });
    if (!inserted) return "duplicate";
    await this.audit.record(principal, "booking.checked_in", item.bookingId, {
      method: item.method,
      checkedInAt: at.toString(),
    });
    return "recorded";
  }
}
