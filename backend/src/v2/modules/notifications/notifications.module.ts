// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { BookingsModule } from "../bookings/bookings.module";
import { AccessModule } from "../access/access.module";
import { IdentityModule } from "../identity/identity.module";
import { WebhookSender } from "./application/webhook-sender";
import { FetchWebhookSender } from "./infrastructure/webhook/fetch-webhook-sender";
import { DeliveryRepository } from "./domain/delivery.repository";
import { PostgresDeliveryRepository } from "./infrastructure/persistence/postgres-delivery.repository";
import { ScheduleReminders } from "./application/commands/schedule-reminders.command";
import { ClaimDeliveries } from "./application/commands/claim-deliveries.command";
import { CompleteDelivery } from "./application/commands/complete-delivery.command";
import { DeliveryWorker } from "./infrastructure/worker/delivery-worker";
@Module({
  imports: [BookingsModule, AccessModule, IdentityModule],
  providers: [
    ScheduleReminders,
    ClaimDeliveries,
    CompleteDelivery,
    DeliveryWorker,
    { provide: DeliveryRepository, useClass: PostgresDeliveryRepository },
    { provide: WebhookSender, useClass: FetchWebhookSender },
  ],
  exports: [DeliveryWorker],
})
export class NotificationsModule {}
