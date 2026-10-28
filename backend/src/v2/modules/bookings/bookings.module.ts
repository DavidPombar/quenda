// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { FacilitiesModule } from "../facilities/facilities.module";
import { BookingRepository } from "./domain/booking.repository";
import { FacilitySchedule } from "./domain/facility-schedule";
import { NotificationRepository } from "./domain/notification.repository";
import { BookingUnitRepository } from "./domain/booking-unit.repository";
import { PostgresBookingUnitRepository } from "./infrastructure/persistence/postgres-booking-unit.repository";
import { PostgresBookingRepository } from "./infrastructure/persistence/postgres-booking.repository";
import { PostgresFacilitySchedule } from "./infrastructure/persistence/postgres-facility-schedule";
import { PostgresNotificationRepository } from "./infrastructure/persistence/postgres-notification.repository";
import { BookingBlockRepository } from "./domain/booking-block.repository";
import { PostgresBookingBlockRepository } from "./infrastructure/persistence/postgres-booking-block.repository";
import { ManageBooking } from "./application/commands/manage-booking.command";
import { ListManagedBookings } from "./application/queries/list-managed-bookings.query";
import { GetPenaltyStanding } from "./application/queries/get-penalty-standing.query";
import { ManageBookingController } from "./infrastructure/api/manager/manage-booking.controller";
import { ListManagedBookingsController } from "./infrastructure/api/manager/list-managed-bookings.controller";
import { GetPenaltyStandingController } from "./infrastructure/api/citizen/get-penalty-standing.controller";
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
  imports: [FacilitiesModule],
  providers: [
    BookingPolicy,
    CreateBooking,
    UpdateBooking,
    ListBookings,
    ListNotifications,
    ManageBooking,
    ListManagedBookings,
    GetPenaltyStanding,
    {
      provide: BookingBlockRepository,
      useClass: PostgresBookingBlockRepository,
    },
    { provide: BookingRepository, useClass: PostgresBookingRepository },
    { provide: FacilitySchedule, useClass: PostgresFacilitySchedule },
    { provide: BookingUnitRepository, useClass: PostgresBookingUnitRepository },
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
    ManageBookingController,
    ListManagedBookingsController,
    GetPenaltyStandingController,
  ],
  exports: [NotificationRepository],
})
export class BookingsModule {}
