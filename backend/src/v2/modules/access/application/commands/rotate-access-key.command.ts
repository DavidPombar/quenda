// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccessKeyRepository } from "../../domain/access-key.repository";
import { AccessKey } from "../../domain/access.read-model";
import { AccessSigner } from "../access-signer";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** New passes use the new key; the retired one stays published for passes already issued. */
@Injectable()
export class RotateAccessKey {
  constructor(
    private readonly keys: AccessKeyRepository,
    private readonly signer: AccessSigner,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<AccessKey, AppError<"forbidden">>> {
    if (!can(args.principal, "municipality:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    const now = this.clock.now();
    await this.keys.retireActive(tenantId, now);
    const key = this.signer.generate(now);
    await this.keys.insert(tenantId, key);
    await this.audit.record(args.principal, "access_key.rotated", tenantId, {
      kid: key.kid,
    });
    return Result.ok({
      kid: key.kid,
      publicJwk: key.publicJwk,
      createdAt: key.createdAt,
      retiredAt: null,
    });
  }
}
