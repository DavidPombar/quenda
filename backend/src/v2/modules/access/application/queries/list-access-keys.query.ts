// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { CredentialKeys, PublicSigningKey } from "../../domain/credential-keys";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type ListAccessKeysError = AppError<"forbidden"> | AppError<"not_found">;
/** What a door device caches to validate credentials without a connection. */
@Injectable()
export class ListAccessKeys {
  constructor(
    private readonly keys: CredentialKeys,
    private readonly municipalities: Municipalities,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<
    Result<
      { issuer: string; timezone: string; keys: PublicSigningKey[] },
      ListAccessKeysError
    >
  > {
    if (!can(args.principal, "access:validate"))
      return Result.err(failure("forbidden"));
    const settings = await this.municipalities.find(args.principal.tenantId);
    if (!settings) return Result.err(failure("not_found"));
    return Result.ok({
      issuer: settings.slug,
      timezone: settings.timezone,
      keys: [await this.keys.active(settings.id)],
    });
  }
}
