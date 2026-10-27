// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { DeliveryRepository } from "../../domain/delivery.repository";
import { NotificationRepository } from "../../../bookings/domain/notification.repository";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Outbox } from "../../../../shared/application/outbox";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Queues the single reminder of each upcoming reservation. Invoked by the worker, not over HTTP. */
@Injectable()
export class ScheduleReminders {
  constructor(
    private readonly deliveries: DeliveryRepository,
    private readonly notifications: NotificationRepository,
    private readonly municipalities: Municipalities,
    private readonly outbox: Outbox,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}
  async execute(args: {
    tenantId: string;
  }): Promise<Result<number, AppError<"not_found">>> {
    const settings = await this.municipalities.find(args.tenantId);
    if (!settings) return Result.err(failure("not_found"));
    const now = this.clock.now();
    let queued = 0;
    for (const due of await this.deliveries.dueReminders(
      settings.id,
      now,
      settings.reminderHours,
    )) {
      // The dedupe key makes a concurrent or repeated run queue nothing twice.
      const inserted = await this.outbox.enqueue({
        id: this.ids.next(),
        tenantId: settings.id,
        userId: due.userId,
        bookingId: due.bookingId,
        kind: "reminder",
        channel: "email",
        dedupeKey: due.dedupeKey,
        createdAt: now,
      });
      if (!inserted) continue;
      await this.notifications.add({
        id: this.ids.next(),
        tenantId: settings.id,
        userId: due.userId,
        bookingId: due.bookingId,
        kind: "reminder",
        createdAt: now,
      });
      queued += 1;
    }
    return Result.ok(queued);
  }
}
