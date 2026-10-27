// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { DeliveryRepository } from "../../domain/delivery.repository";
import { retryDelayMinutes } from "../delivery-policy";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
/** Records the outcome of a delivery attempt; failures become due again after a backoff. */
@Injectable()
export class CompleteDelivery {
  constructor(
    private readonly deliveries: DeliveryRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    id: string;
    attempts: number;
    error?: string;
  }): Promise<Result<void, never>> {
    const now = this.clock.now();
    if (args.error === undefined)
      await this.deliveries.markSent(args.id, now, null);
    else
      await this.deliveries.markFailed(
        args.id,
        args.error.slice(0, 500),
        now.add({ minutes: retryDelayMinutes(args.attempts) }),
      );
    return Result.ok();
  }
}
