// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { EnrolmentRepository } from "../../domain/enrolment.repository";
import type { MyEnrolment } from "../../domain/enrolment.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** The person's enrolments, open ones first, with their place in each waiting list (#97). */
@Injectable()
export class ListMyEnrolments {
  constructor(
    private readonly enrolments: EnrolmentRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<MyEnrolment[], AppError<"forbidden">>> {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    return Result.ok(
      await this.enrolments.mine(
        args.principal.tenantId,
        args.principal.userId,
        this.clock.now(),
      ),
    );
  }
}
