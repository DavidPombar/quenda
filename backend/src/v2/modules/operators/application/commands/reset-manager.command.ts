// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { DeploymentRepository } from "../../domain/deployment.repository";
import { CredentialIssuer } from "../../../identity/application/credential-issuer";
import {
  OperatorPrincipal,
  canOperate,
} from "../../../../shared/application/operator-principal";
import { OperatorAudit } from "../../../../shared/application/operator-audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type ResetManagerError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"local_accounts_unavailable">;
/**
 * New temporary password for a manager who lost it or their authenticator (#8): their sessions end
 * and the second factor is set up again at the next sign-in.
 */
@Injectable()
export class ResetManager {
  constructor(
    private readonly deployment: DeploymentRepository,
    private readonly issuer: CredentialIssuer,
    private readonly audit: OperatorAudit,
  ) {}
  async execute(args: {
    principal: OperatorPrincipal;
    municipalityId: string;
    userId: string;
  }): Promise<
    Result<{ login: string; temporaryPassword: string }, ResetManagerError>
  > {
    if (!canOperate(args.principal, "deployment:manage"))
      return Result.err(failure("forbidden"));
    const user = await this.deployment.findUser(args.userId);
    if (
      !user ||
      user.role !== "manager" ||
      user.tenantId !== args.municipalityId
    )
      return Result.err(failure("not_found"));
    const reset = await this.issuer.reset({
      realm: "tenant",
      subjectId: user.id,
    });
    if (!reset.isFailure)
      await this.audit.record(
        args.principal,
        "manager.credentials_reset",
        user.id,
        user.tenantId,
      );
    return reset;
  }
}
