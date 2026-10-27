// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccessRepository } from "../../domain/access.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { SecretBox } from "../../../../shared/application/secret-box";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type UpdateAccessWebhookError =
  AppError<"forbidden"> | AppError<"validation">;
/**
 * Points booking changes at the council's access-control system. A new signing secret is
 * returned once, when requested or when none exists yet; only its sealed form is stored.
 */
@Injectable()
export class UpdateAccessWebhook {
  constructor(
    private readonly access: AccessRepository,
    private readonly ids: IdGenerator,
    private readonly secrets: SecretBox,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    url: string;
    rotateSecret: boolean;
  }): Promise<
    Result<{ url: string; secret: string | null }, UpdateAccessWebhookError>
  > {
    if (!can(args.principal, "municipality:manage"))
      return Result.err(failure("forbidden"));
    const url = args.url.trim();
    if (url && !/^https?:\/\/[^\s]+$/.test(url))
      return Result.err(failure("validation"));
    const { tenantId } = args.principal;
    const current = await this.access.webhook(tenantId);
    let secret: string | null = null;
    let sealed = current.secretSealed;
    if (url && (args.rotateSecret || !sealed)) {
      // Two random v4 UUIDs give 244 bits from the platform's CSPRNG.
      secret = (this.ids.next() + this.ids.next()).replaceAll("-", "");
      sealed = this.secrets.seal(secret);
    }
    await this.access.setWebhook(tenantId, url, url ? sealed : null);
    await this.audit.record(
      args.principal,
      "access_webhook.updated",
      tenantId,
      { enabled: Boolean(url), secretRotated: secret !== null },
    );
    return Result.ok({ url, secret });
  }
}
