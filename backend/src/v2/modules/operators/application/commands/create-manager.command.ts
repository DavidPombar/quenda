// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  DeploymentRepository,
  StaffMember,
} from "../../domain/deployment.repository";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import {
  OperatorPrincipal,
  canOperate,
} from "../../../../shared/application/operator-principal";
import { OperatorAudit } from "../../../../shared/application/operator-audit";
import { Result } from "../../../../shared/application/result";
import { CredentialIssuer } from "../../../identity/application/credential-issuer";
import { CredentialRepository } from "../../../identity/domain/credential.repository";
import { AppError, failure } from "../../../../shared/application/errors";
export type CreateManagerError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"id_reused">
  | AppError<"validation">
  | AppError<"login_taken">
  | AppError<"local_accounts_unavailable">;
/** The temporary password is shown once, to the operator who created the account. */
export interface CreatedManager extends StaffMember {
  login: string | null;
  temporaryPassword: string | null;
}
@Injectable()
export class CreateManager {
  constructor(
    private readonly deployment: DeploymentRepository,
    private readonly municipalities: Municipalities,
    private readonly audit: OperatorAudit,
    private readonly issuer: CredentialIssuer,
    private readonly credentials: CredentialRepository,
  ) {}
  async execute(args: {
    principal: OperatorPrincipal;
    municipalityId: string;
    id: string;
    displayName: string;
    email: string;
    /** With a login the manager gets a local account (#8); without one, none yet. */
    login?: string;
  }): Promise<Result<CreatedManager, CreateManagerError>> {
    if (!canOperate(args.principal, "deployment:manage"))
      return Result.err(failure("forbidden"));
    if (!(await this.municipalities.find(args.municipalityId)))
      return Result.err(failure("not_found"));
    const manager: StaffMember = {
      id: args.id,
      tenantId: args.municipalityId,
      displayName: args.displayName.trim(),
      email: args.email.trim().toLowerCase(),
    };
    const existing = await this.deployment.findUser(args.id);
    if (existing) {
      // A retry never shows the temporary password again.
      const credential = await this.credentials.findBySubject(
        "tenant",
        manager.id,
      );
      return existing.role === "manager" &&
        existing.tenantId === manager.tenantId &&
        existing.displayName === manager.displayName &&
        existing.email === manager.email
        ? Result.ok({
            ...manager,
            login: credential?.login ?? null,
            temporaryPassword: null,
          })
        : Result.err(failure("id_reused"));
    }
    await this.deployment.createManager(manager);
    let account: { login: string; temporaryPassword: string } | null = null;
    if (args.login !== undefined) {
      const issued = await this.issuer.issue({
        realm: "tenant",
        tenantId: manager.tenantId,
        subjectId: manager.id,
        login: args.login,
      });
      if (issued.isFailure)
        return issued.fold<Result<CreatedManager, CreateManagerError>>(
          () => Result.err(failure("validation")),
          (error) => Result.err(error),
        );
      account = issued.fold(
        (value) => value,
        () => null,
      );
    }
    await this.audit.record(
      args.principal,
      "manager.created",
      manager.id,
      manager.tenantId,
      { displayName: manager.displayName, login: account?.login ?? null },
    );
    return Result.ok({
      ...manager,
      login: account?.login ?? null,
      temporaryPassword: account?.temporaryPassword ?? null,
    });
  }
}
