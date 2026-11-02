// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { WaitlistRepository } from "../../domain/waitlist.repository";
import { WaitlistEntryView } from "../../domain/waitlist-entry.entity";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** The person's open waiting-list entries with their place in each queue (C4). */
@Injectable()
export class ListWaitlist {
  constructor(private readonly entries: WaitlistRepository) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<WaitlistEntryView[], AppError<"forbidden">>> {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    return Result.ok(
      await this.entries.listOpen(
        args.principal.tenantId,
        args.principal.userId,
      ),
    );
  }
}
