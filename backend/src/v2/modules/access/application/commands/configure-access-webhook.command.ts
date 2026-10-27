// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccessWebhookRepository } from "../../domain/access-webhook.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type ConfigureAccessWebhookError =
  AppError<"forbidden"> | AppError<"validation">;
const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
/** HTTPS, except a local receiver such as the simulator. */
export function acceptableWebhookUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      value.length <= 500 &&
      !url.username &&
      !url.password &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" && loopback.has(url.hostname)))
    );
  } catch {
    return false;
  }
}
/**
 * The open "reserva confirmada → credencial temporal" webhook any lock or light controller can
 * consume. A secret is created with the first URL and can be replaced; it is only shown once.
 */
@Injectable()
export class ConfigureAccessWebhook {
  constructor(
    private readonly webhooks: AccessWebhookRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    url: string | null;
    rotateSecret: boolean;
  }): Promise<
    Result<
      { url: string | null; secret: string | null },
      ConfigureAccessWebhookError
    >
  > {
    if (!can(args.principal, "municipality:manage"))
      return Result.err(failure("forbidden"));
    const url = args.url?.trim() || null;
    if (url && !acceptableWebhookUrl(url))
      return Result.err(failure("validation"));
    const { tenantId } = args.principal;
    const current = await this.webhooks.find(tenantId);
    const secret = await this.webhooks.save({
      tenantId,
      url,
      newSecret: !!url && (args.rotateSecret || !current.hasSecret),
    });
    await this.audit.record(
      args.principal,
      "access.webhook_configured",
      tenantId,
      { url, secretRotated: secret !== null },
    );
    return Result.ok({ url, secret });
  }
}
