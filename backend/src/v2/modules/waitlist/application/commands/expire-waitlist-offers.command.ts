// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { BookingUnitRepository } from "../../../bookings/domain/booking-unit.repository";
import { FacilitySchedule } from "../../../bookings/domain/facility-schedule";
import { WaitlistRepository } from "../../domain/waitlist.repository";
import { WaitlistMatcher } from "../waitlist-matcher";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/**
 * Ends the offers whose time is up and passes each place to the next person waiting, then
 * deletes the entries of slots that have ended (T4). Invoked by the worker, not over HTTP; the
 * status guard makes a repeated or concurrent run change nothing twice.
 */
@Injectable()
export class ExpireWaitlistOffers {
  constructor(
    private readonly entries: WaitlistRepository,
    private readonly units: BookingUnitRepository,
    private readonly facilities: FacilitySchedule,
    private readonly matcher: WaitlistMatcher,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    tenantId: string;
  }): Promise<
    Result<{ expired: number; deleted: number }, AppError<"not_found">>
  > {
    const settings = await this.municipalities.find(args.tenantId);
    if (!settings) return Result.err(failure("not_found"));
    const now = this.clock.now();
    let expired = 0;
    for (const due of await this.entries.expiredOffers(settings.id, now)) {
      // The facility lock first, as reservations take it before accepting an offer.
      await this.facilities.lock(settings.id, due.facilityId);
      const entry = await this.entries.end(settings.id, due.id, "expired");
      if (!entry) continue;
      await this.units.releaseHold(settings.id, entry.id);
      await this.entries.recordOutcome({
        tenantId: settings.id,
        facilityId: entry.facilityId,
        day: entry.start.toZonedDateTimeISO(settings.timezone).toPlainDate(),
        outcome: "expired",
      });
      await this.matcher.passOn(entry, now);
      expired += 1;
    }
    const deleted = await this.entries.deletePast(settings.id, now);
    return Result.ok({ expired, deleted });
  }
}
