// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { OidcProvider } from "../../domain/oidc-provider";
import { LoginAttemptRepository } from "../../domain/login-attempt.repository";
import { safeReturnTo } from "../../domain/sign-in-target";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { SecretGenerator } from "../../../../shared/application/secret-generator";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type StartOidcLoginError =
  | AppError<"not_found">
  | AppError<"consent_required">
  | AppError<"oidc_unavailable">;
const attemptMinutes = 10;
/**
 * Opens an OIDC sign-in for a citizen: state, nonce and PKCE verifier are generated here and the
 * attempt is stored for ten minutes. The raw state goes back to the browser only (cookie + URL).
 * Building the URL may fetch the provider's discovery document on a cold cache: a read-only GET
 * done before any write of this transaction.
 */
@Injectable()
export class StartOidcLogin {
  constructor(
    private readonly oidc: OidcProvider,
    private readonly attempts: LoginAttemptRepository,
    private readonly municipalities: Municipalities,
    private readonly secrets: SecretGenerator,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    slug: string;
    legalVersion?: string;
    returnTo?: string;
  }): Promise<
    Result<
      { authorizationUrl: string; state: string; returnTo: string },
      StartOidcLoginError
    >
  > {
    if (!this.oidc.enabled()) return Result.err(failure("oidc_unavailable"));
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    // OIDC only creates citizen accounts, and every citizen sign-in accepts the current notice.
    if (args.legalVersion !== municipality.legalVersion)
      return Result.err(failure("consent_required"));
    const returnTo = safeReturnTo(municipality.slug, args.returnTo);
    const state = this.secrets.randomToken(32);
    const nonce = this.secrets.randomToken(32);
    const codeVerifier = this.secrets.randomToken(32);
    const authorizationUrl = await this.oidc.authorizationUrl({
      state,
      nonce,
      codeVerifier,
    });
    if (!authorizationUrl) return Result.err(failure("oidc_unavailable"));
    await this.attempts.save(state, {
      tenantId: municipality.id,
      nonce,
      codeVerifier,
      legalVersion: municipality.legalVersion,
      returnTo,
      expiresAt: this.clock.now().add({ minutes: attemptMinutes }),
    });
    return Result.ok({ authorizationUrl, state, returnTo });
  }
}
