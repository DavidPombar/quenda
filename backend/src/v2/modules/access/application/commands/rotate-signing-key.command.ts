// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { CredentialKeys, PublicSigningKey } from "../../domain/credential-keys";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type RotateSigningKeyError = AppError<"forbidden">;
/**
 * Replaces the municipality's signing key, e.g. after a lost door phone. Credentials signed with the
 * old key stop validating; people's apps fetch a new QR and phones refresh the key list.
 */
@Injectable()
export class RotateSigningKey {
  constructor(
    private readonly keys: CredentialKeys,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<PublicSigningKey, RotateSigningKeyError>> {
    if (!can(args.principal, "municipality:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    const previous = await this.keys.active(tenantId);
    const key = await this.keys.rotate(tenantId, this.clock.now());
    await this.audit.record(args.principal, "access.key_rotated", key.id, {
      previousKeyId: previous.id,
    });
    return Result.ok(key);
  }
}
