// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { WaitlistOffers } from "../../../shared/application/waitlist-offers";
import { Municipalities } from "../../../shared/application/municipality-settings";
import { Outbox, queueWaitlistOffer } from "../../../shared/application/outbox";
import { IdGenerator } from "../../../shared/application/id-generator";
import { BookingUnitRepository } from "../../bookings/domain/booking-unit.repository";
import { BookingRepository } from "../../bookings/domain/booking.repository";
import { BookingBlockRepository } from "../../bookings/domain/booking-block.repository";
import { FacilitySchedule } from "../../bookings/domain/facility-schedule";
import { NotificationRepository } from "../../bookings/domain/notification.repository";
import { placeOf } from "../../bookings/application/commands/create-booking.command";
import { WaitlistRepository } from "../domain/waitlist.repository";
import { WaitlistEntry } from "../domain/waitlist-entry.entity";
/**
 * Offers freed places to the people waiting (#96). An offer holds the place with the same rules
 * as a reservation of that person, so the slot is not free for anyone else while it lasts, and
 * its notices commit with the change that freed the place.
 */
@Injectable()
export class WaitlistMatcher extends WaitlistOffers {
  constructor(
    private readonly entries: WaitlistRepository,
    private readonly units: BookingUnitRepository,
    private readonly bookings: BookingRepository,
    private readonly blocks: BookingBlockRepository,
    private readonly facilities: FacilitySchedule,
    private readonly municipalities: Municipalities,
    private readonly notifications: NotificationRepository,
    private readonly outbox: Outbox,
    private readonly ids: IdGenerator,
  ) {
    super();
  }
  async offer(args: Parameters<WaitlistOffers["offer"]>[0]) {
    const { tenantId, facilityId, now } = args;
    const settings = await this.municipalities.find(tenantId);
    if (!settings || settings.waitlistMaxEntries === 0) return 0;
    const facility = await this.facilities.lock(tenantId, facilityId);
    if (!facility || facility.status !== "active") return 0;
    const resources = await this.facilities.resources(tenantId, facilityId);
    let offered = 0;
    for (const entry of await this.entries.queue(args)) {
      const resource = resources.find((value) => value.id === entry.resourceId);
      if (!resource?.active) continue;
      // People who could not book now keep their place in the queue for a later offer.
      if (await this.blocks.active(tenantId, entry.userId, now)) continue;
      if (
        (await this.bookings.countActive(tenantId, entry.userId, now)) >=
        settings.maxActiveBookings
      )
        continue;
      const held = await this.units.hold({
        tenantId,
        entryId: entry.id,
        ...placeOf(resource, resources, entry.userId),
        start: entry.start,
        end: entry.end,
      });
      if (held.isFailure) continue;
      const deadline = now.add({ minutes: settings.waitlistOfferMinutes });
      const expiresAt =
        Temporal.Instant.compare(deadline, entry.start) < 0
          ? deadline
          : entry.start;
      await this.entries.offer(tenantId, entry.id, now, expiresAt);
      await this.notifications.add({
        id: this.ids.next(),
        tenantId,
        userId: entry.userId,
        bookingId: null,
        waitlistEntryId: entry.id,
        kind: "waitlist_offer",
        createdAt: now,
        details: { offerExpiresAt: expiresAt.toString() },
      });
      await queueWaitlistOffer(this.outbox, {
        newId: () => this.ids.next(),
        tenantId,
        userId: entry.userId,
        entryId: entry.id,
        createdAt: now,
      });
      offered += 1;
    }
    return offered;
  }
  async accept(args: Parameters<WaitlistOffers["accept"]>[0]) {
    const entry = await this.entries.accept({
      tenantId: args.tenantId,
      userId: args.userId,
      id: args.entryId,
      resourceId: args.resourceId,
      start: args.start,
      bookingId: args.bookingId,
      now: args.now,
    });
    if (!entry) return false;
    await this.units.releaseHold(args.tenantId, entry.id);
    await this.entries.recordOutcome({
      tenantId: args.tenantId,
      facilityId: entry.facilityId,
      day: entry.start.toZonedDateTimeISO(args.timezone).toPlainDate(),
      outcome: "accepted",
    });
    return true;
  }
  async close(tenantId: string, facilityId: string) {
    for (const entry of await this.entries.openOfFacility(
      tenantId,
      facilityId,
    )) {
      await this.units.releaseHold(tenantId, entry.id);
      await this.entries.end(tenantId, entry.id, "closed");
    }
  }
  async forget(tenantId: string, userId: string, now: Temporal.Instant) {
    const offered = (await this.entries.openOfUser(tenantId, userId)).filter(
      (entry) => entry.status === "offered",
    );
    await this.entries.deleteOfUser(tenantId, userId);
    for (const entry of offered) await this.passOn(entry, now);
  }
  /** Offers the place an entry held to the next people waiting. */
  async passOn(entry: WaitlistEntry, now: Temporal.Instant) {
    return this.offer({
      tenantId: entry.tenantId,
      facilityId: entry.facilityId,
      start: entry.start,
      end: entry.end,
      now,
    });
  }
}
