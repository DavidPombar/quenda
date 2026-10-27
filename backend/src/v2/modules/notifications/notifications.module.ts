// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { BookingsModule } from "../bookings/bookings.module";
import { DeliveryRepository } from "./domain/delivery.repository";
import { PostgresDeliveryRepository } from "./infrastructure/persistence/postgres-delivery.repository";
import { Mailer } from "./application/mailer";
import { SmtpMailer } from "./infrastructure/mail/smtp-mailer";
import { ScheduleReminders } from "./application/commands/schedule-reminders.command";
import { ClaimDeliveries } from "./application/commands/claim-deliveries.command";
import { CompleteDelivery } from "./application/commands/complete-delivery.command";
import { DeliveryWorker } from "./infrastructure/worker/delivery-worker";
@Module({
  imports: [BookingsModule],
  providers: [
    ScheduleReminders,
    ClaimDeliveries,
    CompleteDelivery,
    DeliveryWorker,
    { provide: DeliveryRepository, useClass: PostgresDeliveryRepository },
    { provide: Mailer, useClass: SmtpMailer },
  ],
  exports: [DeliveryWorker],
})
export class NotificationsModule {}
