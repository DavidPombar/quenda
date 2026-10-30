// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { CredentialRepository, Realm } from "../domain/credential.repository";
import { hashPassword, normaliseLogin } from "../domain/password";
import { SecretGenerator } from "../../../shared/application/secret-generator";
import { DataProtector } from "../../../shared/application/data-protector";
import { Clock } from "../../../shared/application/clock";
import { IdGenerator } from "../../../shared/application/id-generator";
import { Result } from "../../../shared/application/result";
import { AppError, failure } from "../../../shared/application/errors";
export type IssueCredentialError =
  | AppError<"validation">
  | AppError<"login_taken">
  | AppError<"local_accounts_unavailable">;
/**
 * Creates or resets a local account with a temporary password, shown once to whoever issued it.
 * The person changes it and sets up the second factor at the first sign-in. Used by the operator
 * for managers, by managers for door staff and by the command line.
 */
@Injectable()
export class CredentialIssuer {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly secrets: SecretGenerator,
    private readonly protector: DataProtector,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}
  /** The second factor's secret is encrypted, so local accounts need the data key. */
  available() {
    return this.protector.available();
  }
  private temporaryPassword() {
    return this.secrets.randomToken(12);
  }
  async issue(args: {
    realm: Realm;
    tenantId: string | null;
    subjectId: string;
    login: string;
  }): Promise<
    Result<{ login: string; temporaryPassword: string }, IssueCredentialError>
  > {
    if (!this.available())
      return Result.err(failure("local_accounts_unavailable"));
    const login = normaliseLogin(args.login);
    if (!login) return Result.err(failure("validation"));
    if (await this.credentials.loginTaken(args.realm, args.tenantId, login))
      return Result.err(failure("login_taken"));
    const temporaryPassword = this.temporaryPassword();
    await this.credentials.create({
      id: this.ids.next(),
      realm: args.realm,
      tenantId: args.tenantId,
      subjectId: args.subjectId,
      login,
      passwordHash: await hashPassword(temporaryPassword),
      at: this.clock.now(),
    });
    if (args.realm === "tenant" && args.tenantId)
      await this.credentials.markLocal(args.tenantId, args.subjectId);
    return Result.ok({ login, temporaryPassword });
  }
  /** New temporary password; sessions end and the second factor is set up again. */
  async reset(args: {
    realm: Realm;
    subjectId: string;
  }): Promise<
    Result<
      { login: string; temporaryPassword: string },
      AppError<"not_found"> | AppError<"local_accounts_unavailable">
    >
  > {
    if (!this.available())
      return Result.err(failure("local_accounts_unavailable"));
    const credential = await this.credentials.findBySubject(
      args.realm,
      args.subjectId,
    );
    if (!credential) return Result.err(failure("not_found"));
    const temporaryPassword = this.temporaryPassword();
    await this.credentials.reset(
      credential.id,
      await hashPassword(temporaryPassword),
      this.clock.now(),
    );
    await this.credentials.revokeSessions(args.realm, args.subjectId);
    return Result.ok({ login: credential.login, temporaryPassword });
  }
}
