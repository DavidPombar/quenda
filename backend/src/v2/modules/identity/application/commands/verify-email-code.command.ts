// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { LoginCodeRepository } from "../../domain/login-code.repository";
import { ExternalIdentityRepository } from "../../domain/external-identity.repository";
import { SessionRepository } from "../../domain/session.repository";
import {
  CODE_ATTEMPTS,
  EMAIL_ISSUER,
  codeMatches,
  emailHash,
  nameFromEmail,
  normaliseEmail,
} from "../../domain/email-code";
import { emailLoginEnabled } from "../email-login";
import { ConsentRepository } from "../../../account/domain/consent.repository";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
import { Principal } from "../../../../shared/application/principal";
export type VerifyEmailCodeError =
  | AppError<"not_found">
  | AppError<"validation">
  | AppError<"email_login_disabled">;
/**
 * A wrong or stale code is an outcome, not an error: the failed attempt must commit, and an error
 * Result would roll it back.
 */
export type VerifyEmailCodeOutcome =
  | { signedIn: { token: string; principal: Principal } }
  | { rejected: "code_invalid" | "code_expired" };
/**
 * Signs a citizen in with the code mailed to them. The account is found by the email identity
 * only: an address that also belongs to a Cl@ve account opens a separate account, so the lower
 * assurance never reaches an eID account.
 */
@Injectable()
export class VerifyEmailCode {
  constructor(
    private readonly codes: LoginCodeRepository,
    private readonly identities: ExternalIdentityRepository,
    private readonly sessions: SessionRepository,
    private readonly consents: ConsentRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    slug: string;
    email: string;
    code: string;
  }): Promise<Result<VerifyEmailCodeOutcome, VerifyEmailCodeError>> {
    if (!emailLoginEnabled())
      return Result.err(failure("email_login_disabled"));
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    const email = normaliseEmail(args.email);
    if (!email || !/^\s*[0-9]{6}\s*$/.test(args.code))
      return Result.err(failure("validation"));
    const now = this.clock.now();
    const hash = emailHash(email);
    const code = await this.codes.latest(municipality.id, hash);
    if (!code || code.consumedAt)
      return Result.ok({ rejected: "code_invalid" });
    if (
      Temporal.Instant.compare(code.expiresAt, now) <= 0 ||
      code.attempts >= CODE_ATTEMPTS ||
      code.legalVersion !== municipality.legalVersion
    )
      return Result.ok({ rejected: "code_expired" });
    if (!codeMatches(code.id, args.code, code.codeHash)) {
      await this.codes.recordFailure(code.id);
      return Result.ok({
        rejected:
          code.attempts + 1 >= CODE_ATTEMPTS ? "code_expired" : "code_invalid",
      });
    }
    await this.codes.consume(code.id, now);
    const profile = {
      displayName: nameFromEmail(email),
      email,
      assurance: "email" as const,
    };
    const existing = await this.identities.findUser(
      municipality.id,
      EMAIL_ISSUER,
      hash,
    );
    let principal: Principal;
    if (existing)
      // The person may have changed their name elsewhere; only the address is refreshed.
      principal = await this.identities.updateCitizen(
        municipality.id,
        existing.userId,
        { ...profile, displayName: existing.displayName },
      );
    else {
      principal = await this.identities.createCitizen({
        id: this.ids.next(),
        tenantId: municipality.id,
        profile,
      });
      await this.identities.link({
        id: this.ids.next(),
        tenantId: municipality.id,
        userId: principal.userId,
        issuer: EMAIL_ISSUER,
        subject: hash,
        createdAt: now,
      });
    }
    await this.consents.add({
      id: this.ids.next(),
      tenantId: municipality.id,
      userId: principal.userId,
      legalVersion: municipality.legalVersion,
      acceptedAt: now,
    });
    await this.audit.record(principal, "consent.accepted", principal.userId, {
      legalVersion: municipality.legalVersion,
    });
    await this.audit.record(principal, "auth.signed_in", principal.userId, {
      method: "email",
    });
    const token = await this.sessions.create(principal, now.add({ hours: 8 }));
    return Result.ok({ signedIn: { token, principal } });
  }
}
