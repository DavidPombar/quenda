// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { BookingRepository } from "../../domain/booking.repository";
import { BookingBlockRepository } from "../../domain/booking-block.repository";
import {
  PenaltyStanding,
  penaltyStanding,
  windowStart,
} from "../../domain/no-show-penalty";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** The person's no-shows against the municipal penalty, and any block in force. */
@Injectable()
export class GetPenaltyStanding {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly blocks: BookingBlockRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<
    Result<PenaltyStanding, AppError<"forbidden"> | AppError<"not_found">>
  > {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    const settings = await this.municipalities.find(tenantId);
    if (!settings) return Result.err(failure("not_found"));
    const now = this.clock.now();
    const block = await this.blocks.active(tenantId, userId, now);
    return Result.ok(
      penaltyStanding({
        noShowStarts: await this.bookings.noShowStarts(
          tenantId,
          userId,
          windowStart(settings, now),
        ),
        settings,
        now,
        blockedUntil: block?.end ?? null,
      }),
    );
  }
}
