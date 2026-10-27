// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { DeliveryRepository } from "../../domain/delivery.repository";
import { Delivery } from "../../domain/delivery.read-model";
import { LEASE_MINUTES, MAX_ATTEMPTS } from "../delivery-policy";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
/**
 * Leases due messages for delivery outside the transaction. Messages nobody can receive any more
 * (no address, deleted account, reminder of a cancelled reservation) are closed without sending.
 */
@Injectable()
export class ClaimDeliveries {
  constructor(
    private readonly deliveries: DeliveryRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: { limit: number }): Promise<Result<Delivery[], never>> {
    const now = this.clock.now();
    const claimed = await this.deliveries.claim({
      now,
      leaseUntil: now.add({ minutes: LEASE_MINUTES }),
      maxAttempts: MAX_ATTEMPTS,
      limit: args.limit,
    });
    const ready: Delivery[] = [];
    for (const delivery of claimed) {
      const skip = !delivery.email
        ? "skipped:no_recipient"
        : delivery.kind === "reminder" && delivery.bookingStatus === "cancelled"
          ? "skipped:cancelled"
          : null;
      if (skip) await this.deliveries.markSent(delivery.id, now, skip);
      else ready.push(delivery);
    }
    return Result.ok(ready);
  }
}
