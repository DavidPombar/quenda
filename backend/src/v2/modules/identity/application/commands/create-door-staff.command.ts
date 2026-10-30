// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { CredentialRepository } from "../../domain/credential.repository";
import { CredentialIssuer } from "../credential-issuer";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type CreateDoorStaffError =
  | AppError<"forbidden">
  | AppError<"validation">
  | AppError<"id_reused">
  | AppError<"login_taken">
  | AppError<"local_accounts_unavailable">;
/**
 * The manager opens an account for door staff (#23) with a temporary password shown once (#8).
 * The id comes from the client, so a retry returns the account without the password again.
 */
@Injectable()
export class CreateDoorStaff {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly issuer: CredentialIssuer,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    displayName: string;
    login: string;
  }): Promise<
    Result<
      { login: string; temporaryPassword: string | null },
      CreateDoorStaffError
    >
  > {
    if (!can(args.principal, "municipality:manage"))
      return Result.err(failure("forbidden"));
    const tenantId = args.principal.tenantId;
    const displayName = args.displayName.trim();
    if (displayName.length < 2 || displayName.length > 120)
      return Result.err(failure("validation"));
    const existing = await this.credentials.findBySubject("tenant", args.id);
    if (existing)
      return existing.tenantId === tenantId
        ? Result.ok({ login: existing.login, temporaryPassword: null })
        : Result.err(failure("id_reused"));
    if (!this.issuer.available())
      return Result.err(failure("local_accounts_unavailable"));
    await this.credentials.createStaffUser({
      id: args.id,
      tenantId,
      displayName,
      role: "access",
    });
    const issued = await this.issuer.issue({
      realm: "tenant",
      tenantId,
      subjectId: args.id,
      login: args.login,
    });
    if (!issued.isFailure)
      await this.audit.record(args.principal, "staff.created", args.id, {
        role: "access",
        displayName,
        login: issued.fold(
          (value) => value.login,
          () => null,
        ),
      });
    return issued;
  }
}
