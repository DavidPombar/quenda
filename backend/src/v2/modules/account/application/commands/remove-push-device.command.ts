// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccountRepository } from "../../domain/account.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type RemovePushDeviceError = AppError<"forbidden">;
/** Stops push notices to one device. Idempotent: an unknown device is not an error. */
@Injectable()
export class RemovePushDevice {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    endpoint: string;
  }): Promise<Result<void, RemovePushDeviceError>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    if (await this.accounts.removePushDevice(tenantId, userId, args.endpoint))
      await this.audit.record(args.principal, "push_device.removed", userId);
    return Result.ok();
  }
}
