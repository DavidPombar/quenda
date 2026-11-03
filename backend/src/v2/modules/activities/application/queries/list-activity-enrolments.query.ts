// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { EnrolmentRepository } from "../../domain/enrolment.repository";
import type { ManagedEnrolmentPage } from "../../domain/enrolment.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** One page of the people enrolled in or waiting for an activity, for the backoffice (#97). */
@Injectable()
export class ListActivityEnrolments {
  constructor(private readonly enrolments: EnrolmentRepository) {}
  async execute(args: {
    principal: Principal;
    activityId: string;
    status?: "enrolled" | "waiting";
    page: number;
    pageSize: number;
  }): Promise<
    Result<ManagedEnrolmentPage, AppError<"forbidden"> | AppError<"not_found">>
  > {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    if (!(await this.enrolments.activityExists(tenantId, args.activityId)))
      return Result.err(failure("not_found"));
    return Result.ok(
      await this.enrolments.page({
        tenantId,
        activityId: args.activityId,
        status: args.status,
        page: args.page,
        size: args.pageSize,
      }),
    );
  }
}
