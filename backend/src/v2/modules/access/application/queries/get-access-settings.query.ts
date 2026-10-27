// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { CredentialKeys, PublicSigningKey } from "../../domain/credential-keys";
import {
  AccessWebhookRepository,
  AccessWebhookSettings,
} from "../../domain/access-webhook.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type GetAccessSettingsError = AppError<"forbidden">;
@Injectable()
export class GetAccessSettings {
  constructor(
    private readonly keys: CredentialKeys,
    private readonly webhooks: AccessWebhookRepository,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<
    Result<
      { key: PublicSigningKey; webhook: AccessWebhookSettings },
      GetAccessSettingsError
    >
  > {
    if (!can(args.principal, "municipality:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    return Result.ok({
      key: await this.keys.active(tenantId),
      webhook: await this.webhooks.find(tenantId),
    });
  }
}
