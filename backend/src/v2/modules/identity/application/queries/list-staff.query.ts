// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  CredentialRepository,
  StaffAccount,
} from "../../domain/credential.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Managers and door staff of the manager's municipality, with their account state. */
@Injectable()
export class ListStaff {
  constructor(private readonly credentials: CredentialRepository) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<StaffAccount[], AppError<"forbidden">>> {
    if (!can(args.principal, "municipality:manage"))
      return Result.err(failure("forbidden"));
    return Result.ok(await this.credentials.staff(args.principal.tenantId));
  }
}
