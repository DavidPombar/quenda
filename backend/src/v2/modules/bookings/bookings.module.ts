// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { FacilitiesModule } from "../facilities/facilities.module";
import { TariffsModule } from "../tariffs/tariffs.module";
import { BookingRepository } from "./domain/booking.repository";
import { FacilitySchedule } from "./domain/facility-schedule";
import { NotificationRepository } from "./domain/notification.repository";
import { PostgresBookingRepository } from "./infrastructure/persistence/postgres-booking.repository";
import { PostgresFacilitySchedule } from "./infrastructure/persistence/postgres-facility-schedule";
import { PostgresNotificationRepository } from "./infrastructure/persistence/postgres-notification.repository";
import { BookingPolicy } from "./application/booking-policy";
import { CreateBooking } from "./application/commands/create-booking.command";
import { UpdateBooking } from "./application/commands/update-booking.command";
import { ListBookings } from "./application/queries/list-bookings.query";
import { ListNotifications } from "./application/queries/list-notifications.query";
import { CreateBookingController } from "./infrastructure/api/citizen/create-booking.controller";
import { UpdateBookingController } from "./infrastructure/api/citizen/update-booking.controller";
import { ListBookingsController } from "./infrastructure/api/citizen/list-bookings.controller";
import { ListNotificationsController } from "./infrastructure/api/citizen/list-notifications.controller";
@Module({
  imports: [FacilitiesModule, TariffsModule],
  providers: [
    BookingPolicy,
    CreateBooking,
    UpdateBooking,
    ListBookings,
    ListNotifications,
    { provide: BookingRepository, useClass: PostgresBookingRepository },
    { provide: FacilitySchedule, useClass: PostgresFacilitySchedule },
    {
      provide: NotificationRepository,
      useClass: PostgresNotificationRepository,
    },
  ],
  controllers: [
    CreateBookingController,
    UpdateBookingController,
    ListBookingsController,
    ListNotificationsController,
  ],
})
export class BookingsModule {}
