// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { CalendarEntryRepository } from "./domain/calendar-entry.repository";
import { CalendarFeedRepository } from "./domain/calendar-feed.repository";
import { PostgresCalendarEntryRepository } from "./infrastructure/persistence/postgres-calendar-entry.repository";
import { PostgresCalendarFeedRepository } from "./infrastructure/persistence/postgres-calendar-feed.repository";
import { GetBookingCalendar } from "./application/queries/get-booking-calendar.query";
import { GetCalendarFeed } from "./application/queries/get-calendar-feed.query";
import { GetFeedCalendar } from "./application/queries/get-feed-calendar.query";
import { RotateCalendarFeed } from "./application/commands/rotate-calendar-feed.command";
import { RevokeCalendarFeed } from "./application/commands/revoke-calendar-feed.command";
import { GetBookingCalendarController } from "./infrastructure/api/citizen/get-booking-calendar.controller";
import { GetCalendarFeedController } from "./infrastructure/api/citizen/get-calendar-feed.controller";
import { RotateCalendarFeedController } from "./infrastructure/api/citizen/rotate-calendar-feed.controller";
import { RevokeCalendarFeedController } from "./infrastructure/api/citizen/revoke-calendar-feed.controller";
import { GetFeedCalendarController } from "./infrastructure/api/public/get-feed-calendar.controller";
/** Personal calendars: RFC 5545 export and subscription of a person's bookings. */
@Module({
  providers: [
    GetBookingCalendar,
    GetCalendarFeed,
    GetFeedCalendar,
    RotateCalendarFeed,
    RevokeCalendarFeed,
    {
      provide: CalendarEntryRepository,
      useClass: PostgresCalendarEntryRepository,
    },
    {
      provide: CalendarFeedRepository,
      useClass: PostgresCalendarFeedRepository,
    },
  ],
  controllers: [
    GetBookingCalendarController,
    GetCalendarFeedController,
    RotateCalendarFeedController,
    RevokeCalendarFeedController,
    GetFeedCalendarController,
  ],
})
export class CalendarsModule {}
