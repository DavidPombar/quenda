// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  CredentialRepository,
  Realm,
} from "../../domain/credential.repository";
import { CredentialIssuer, IssueCredentialError } from "../credential-issuer";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Audit } from "../../../../shared/application/audit";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type ProvisionError = IssueCredentialError | AppError<"not_found">;
/**
 * Creates an account from the command line (#8): the first operator of a deployment, or a manager
 * or door staff of a municipality without an operator. The temporary password is printed once.
 */
@Injectable()
export class ProvisionLocalAccount {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly issuer: CredentialIssuer,
    private readonly municipalities: Municipalities,
    private readonly audit: Audit,
    private readonly ids: IdGenerator,
  ) {}
  async execute(args: {
    realm: Realm;
    slug?: string;
    role?: "manager" | "access";
    displayName: string;
    login: string;
  }): Promise<
    Result<{ login: string; temporaryPassword: string }, ProvisionError>
  > {
    const id = this.ids.next();
    const displayName = args.displayName.trim();
    if (displayName.length < 2) return Result.err(failure("validation"));
    if (!this.issuer.available())
      return Result.err(failure("local_accounts_unavailable"));
    if (args.realm === "operator") {
      await this.credentials.createOperator(id, displayName);
      return this.issuer.issue({
        realm: "operator",
        tenantId: null,
        subjectId: id,
        login: args.login,
      });
    }
    const municipality = args.slug
      ? await this.municipalities.findBySlug(args.slug)
      : null;
    if (!municipality) return Result.err(failure("not_found"));
    await this.credentials.createStaffUser({
      id,
      tenantId: municipality.id,
      displayName,
      role: args.role ?? "manager",
    });
    const issued = await this.issuer.issue({
      realm: "tenant",
      tenantId: municipality.id,
      subjectId: id,
      login: args.login,
    });
    if (!issued.isFailure)
      await this.audit.recordSystem(municipality.id, "staff.created", id, {
        role: args.role ?? "manager",
        displayName,
        source: "command line",
      });
    return issued;
  }
}
