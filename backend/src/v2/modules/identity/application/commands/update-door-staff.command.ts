// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { CredentialRepository } from "../../domain/credential.repository";
import { CredentialIssuer } from "../credential-issuer";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type UpdateDoorStaffError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"local_accounts_unavailable">;
/**
 * Resets, disables or enables a door staff account of the municipality. Managers are handled by
 * the operator, so a manager cannot lock out another manager (or themselves) here.
 */
@Injectable()
export class UpdateDoorStaff {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly issuer: CredentialIssuer,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    userId: string;
    action: "reset" | "disable" | "enable";
  }): Promise<
    Result<
      { login: string; temporaryPassword: string | null },
      UpdateDoorStaffError
    >
  > {
    if (!can(args.principal, "municipality:manage"))
      return Result.err(failure("forbidden"));
    const tenantId = args.principal.tenantId;
    const user = await this.credentials.tenantPrincipal(tenantId, args.userId);
    const credential = await this.credentials.findBySubject(
      "tenant",
      args.userId,
    );
    if (
      !user ||
      user.role !== "access" ||
      !credential ||
      credential.tenantId !== tenantId
    )
      return Result.err(failure("not_found"));
    let temporaryPassword: string | null = null;
    if (args.action === "reset") {
      const reset = await this.issuer.reset({
        realm: "tenant",
        subjectId: user.userId,
      });
      if (reset.isFailure)
        return reset.fold<Result<never, UpdateDoorStaffError>>(
          () => Result.err(failure("not_found")),
          (error) => Result.err(error),
        );
      temporaryPassword = reset.fold(
        (value) => value.temporaryPassword,
        () => null,
      );
    } else if (args.action === "disable") {
      await this.credentials.setDisabled(credential.id, this.clock.now());
      await this.credentials.revokeSessions("tenant", user.userId);
    } else await this.credentials.setDisabled(credential.id, null);
    await this.audit.record(
      args.principal,
      `staff.${args.action === "reset" ? "credentials_reset" : args.action === "disable" ? "disabled" : "enabled"}`,
      user.userId,
      {
        login: credential.login,
      },
    );
    return Result.ok({ login: credential.login, temporaryPassword });
  }
}
