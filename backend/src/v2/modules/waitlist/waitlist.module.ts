// SPDX-License-Identifier: AGPL-3.0-or-later
import { Global, Module } from "@nestjs/common";
import { WaitlistOffers } from "../../shared/application/waitlist-offers";
import { BookingPolicy } from "../bookings/application/booking-policy";
import { BookingRepository } from "../bookings/domain/booking.repository";
import { BookingUnitRepository } from "../bookings/domain/booking-unit.repository";
import { BookingBlockRepository } from "../bookings/domain/booking-block.repository";
import { FacilitySchedule } from "../bookings/domain/facility-schedule";
import { NotificationRepository } from "../bookings/domain/notification.repository";
import { PostgresBookingRepository } from "../bookings/infrastructure/persistence/postgres-booking.repository";
import { PostgresBookingUnitRepository } from "../bookings/infrastructure/persistence/postgres-booking-unit.repository";
import { PostgresBookingBlockRepository } from "../bookings/infrastructure/persistence/postgres-booking-block.repository";
import { PostgresFacilitySchedule } from "../bookings/infrastructure/persistence/postgres-facility-schedule";
import { PostgresNotificationRepository } from "../bookings/infrastructure/persistence/postgres-notification.repository";
import { OpeningCalendar } from "../facilities/domain/opening-calendar";
import { HolidayCalendar } from "../facilities/domain/holiday-calendar";
import { IcalOpeningCalendar } from "../facilities/infrastructure/calendar/ical-opening-calendar";
import { IcalHolidayCalendar } from "../facilities/infrastructure/calendar/ical-holiday-calendar";
import { WaitlistRepository } from "./domain/waitlist.repository";
import { PostgresWaitlistRepository } from "./infrastructure/persistence/postgres-waitlist.repository";
import { WaitlistMatcher } from "./application/waitlist-matcher";
import { JoinWaitlist } from "./application/commands/join-waitlist.command";
import { LeaveWaitlist } from "./application/commands/leave-waitlist.command";
import { ExpireWaitlistOffers } from "./application/commands/expire-waitlist-offers.command";
import { ListWaitlist } from "./application/queries/list-waitlist.query";
import { JoinWaitlistController } from "./infrastructure/api/citizen/join-waitlist.controller";
import { LeaveWaitlistController } from "./infrastructure/api/citizen/leave-waitlist.controller";
import { ListWaitlistController } from "./infrastructure/api/citizen/list-waitlist.controller";
/**
 * Waiting list for full slots (#96). Global because the commands that free places (bookings,
 * seasons, facilities, accounts) offer them through `WaitlistOffers` in their own transaction;
 * it binds its own adapters of the booking ports so it imports no module that depends on it.
 */
@Global()
@Module({
  providers: [
    WaitlistMatcher,
    { provide: WaitlistOffers, useExisting: WaitlistMatcher },
    JoinWaitlist,
    LeaveWaitlist,
    ExpireWaitlistOffers,
    ListWaitlist,
    BookingPolicy,
    { provide: WaitlistRepository, useClass: PostgresWaitlistRepository },
    { provide: BookingRepository, useClass: PostgresBookingRepository },
    { provide: BookingUnitRepository, useClass: PostgresBookingUnitRepository },
    {
      provide: BookingBlockRepository,
      useClass: PostgresBookingBlockRepository,
    },
    { provide: FacilitySchedule, useClass: PostgresFacilitySchedule },
    {
      provide: NotificationRepository,
      useClass: PostgresNotificationRepository,
    },
    { provide: OpeningCalendar, useClass: IcalOpeningCalendar },
    { provide: HolidayCalendar, useClass: IcalHolidayCalendar },
  ],
  controllers: [
    JoinWaitlistController,
    LeaveWaitlistController,
    ListWaitlistController,
  ],
  exports: [WaitlistOffers],
})
export class WaitlistModule {}
