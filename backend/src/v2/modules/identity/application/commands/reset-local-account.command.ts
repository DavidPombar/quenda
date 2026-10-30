// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  CredentialRepository,
  Realm,
} from "../../domain/credential.repository";
import { normaliseLogin } from "../../domain/password";
import { CredentialIssuer } from "../credential-issuer";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Command-line reset: a new temporary password and a new second factor at the next sign-in. */
@Injectable()
export class ResetLocalAccount {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly issuer: CredentialIssuer,
    private readonly municipalities: Municipalities,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    realm: Realm;
    slug?: string;
    login: string;
  }): Promise<
    Result<
      { login: string; temporaryPassword: string },
      AppError<"not_found"> | AppError<"local_accounts_unavailable">
    >
  > {
    const municipality =
      args.realm === "tenant" && args.slug
        ? await this.municipalities.findBySlug(args.slug)
        : null;
    if (args.realm === "tenant" && !municipality)
      return Result.err(failure("not_found"));
    const login = normaliseLogin(args.login);
    const credential = login
      ? await this.credentials.findByLogin(
          args.realm,
          municipality?.id ?? null,
          login,
        )
      : null;
    if (!credential) return Result.err(failure("not_found"));
    const reset = await this.issuer.reset({
      realm: args.realm,
      subjectId: credential.subjectId,
    });
    if (!reset.isFailure && municipality)
      await this.audit.recordSystem(
        municipality.id,
        "staff.credentials_reset",
        credential.subjectId,
        {
          login: credential.login,
          source: "command line",
        },
      );
    return reset;
  }
}
