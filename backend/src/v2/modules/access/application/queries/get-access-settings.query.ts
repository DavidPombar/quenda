// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccessRepository } from "../../domain/access.repository";
import { AccessKeyRepository } from "../../domain/access-key.repository";
import { AccessSettings } from "../../domain/access.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
@Injectable()
export class GetAccessSettings {
  constructor(
    private readonly access: AccessRepository,
    private readonly keys: AccessKeyRepository,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<AccessSettings, AppError<"forbidden">>> {
    if (!can(args.principal, "municipality:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    const webhook = await this.access.webhook(tenantId);
    return Result.ok({
      webhookUrl: webhook.url,
      hasWebhookSecret: webhook.secretSealed !== null,
      keys: await this.keys.all(tenantId),
    });
  }
}
