// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { OidcClaims, OidcProvider } from "../../domain/oidc-provider";
import { LoginAttempt } from "../../domain/login-attempt.repository";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
import { assertNever } from "../../../../shared/application/errors";
export type ExchangeOidcCodeError =
  AppError<"oidc_unavailable"> | AppError<"login_rejected">;
/**
 * Redeems the authorization code at the identity provider and validates the ID token against the
 * consumed attempt (PKCE verifier, nonce, issuer). Run through `Queries`: no transaction is held
 * open during the network call, and nothing is written.
 */
@Injectable()
export class ExchangeOidcCode {
  constructor(private readonly oidc: OidcProvider) {}
  async execute(args: {
    attempt: LoginAttempt;
    state: string;
    code: string;
    issuer: string | null;
  }): Promise<Result<OidcClaims, ExchangeOidcCodeError>> {
    const outcome = await this.oidc.exchange({
      code: args.code,
      state: args.state,
      issuer: args.issuer,
      codeVerifier: args.attempt.codeVerifier,
      nonce: args.attempt.nonce,
    });
    switch (outcome.kind) {
      case "ok":
        return Result.ok(outcome.claims);
      case "unavailable":
        return Result.err(failure("oidc_unavailable"));
      case "rejected":
        return Result.err(failure("login_rejected"));
      default:
        return assertNever(outcome);
    }
  }
}
