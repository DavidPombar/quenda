// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccountRepository } from "../../domain/account.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { PushSender } from "../../../../shared/application/push-sender";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type SavePushDeviceError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"validation">
  | AppError<"push_unavailable">;
/** Registers the browser subscription created after the person allowed notices on a device. */
@Injectable()
export class SavePushDevice {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly push: PushSender,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent: string;
  }): Promise<Result<void, SavePushDeviceError>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    if (!this.push.publicKey()) return Result.err(failure("push_unavailable"));
    // Quenda only calls HTTPS push services, so a subscription cannot point it anywhere else.
    if (!this.push.accepts(args.endpoint))
      return Result.err(failure("validation"));
    const { tenantId, userId } = args.principal;
    await this.accounts.lockUser(tenantId, userId);
    if (!(await this.accounts.find(tenantId, userId)))
      return Result.err(failure("not_found"));
    await this.accounts.savePushDevice({
      id: this.ids.next(),
      tenantId,
      userId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      userAgent: args.userAgent.slice(0, 300),
      createdAt: this.clock.now(),
    });
    await this.audit.record(args.principal, "push_device.added", userId, {
      service: new URL(args.endpoint).origin,
    });
    return Result.ok();
  }
}
