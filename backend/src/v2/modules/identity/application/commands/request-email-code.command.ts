// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { LoginCodeRepository } from "../../domain/login-code.repository";
import {
  CODE_MINUTES,
  CODES_PER_HOUR,
  codeHash,
  emailHash,
  normaliseEmail,
} from "../../domain/email-code";
import { emailLoginEnabled } from "../email-login";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { SecretGenerator } from "../../../../shared/application/secret-generator";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type RequestEmailCodeError =
  | AppError<"not_found">
  | AppError<"validation">
  | AppError<"consent_required">
  | AppError<"email_login_disabled">;
/**
 * Stores a one-time code for an email address (#8, light sign-in). The answer is the same whether
 * or not an account exists, and past five codes an hour the address silently gets no more. The
 * mail goes out after the commit (`codeId`), never inside the transaction.
 */
@Injectable()
export class RequestEmailCode {
  constructor(
    private readonly codes: LoginCodeRepository,
    private readonly municipalities: Municipalities,
    private readonly secrets: SecretGenerator,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}
  async execute(args: {
    slug: string;
    email: string;
    legalVersion?: string;
    locale?: "gl" | "es";
  }): Promise<Result<{ codeId: string | null }, RequestEmailCodeError>> {
    if (!emailLoginEnabled())
      return Result.err(failure("email_login_disabled"));
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    const email = normaliseEmail(args.email);
    if (!email) return Result.err(failure("validation"));
    // A citizen sign-in always accepts the current privacy notice.
    if (args.legalVersion !== municipality.legalVersion)
      return Result.err(failure("consent_required"));
    const now = this.clock.now();
    const hash = emailHash(email);
    if (
      (await this.codes.countSince(
        municipality.id,
        hash,
        now.subtract({ hours: 1 }),
      )) >= CODES_PER_HOUR
    )
      return Result.ok({ codeId: null });
    const id = this.ids.next();
    const code = this.secrets.numericCode(6);
    await this.codes.add({
      id,
      tenantId: municipality.id,
      emailHash: hash,
      recipient: email,
      pendingCode: code,
      codeHash: codeHash(id, code),
      legalVersion: municipality.legalVersion,
      locale: args.locale ?? municipality.locale,
      createdAt: now,
      expiresAt: now.add({ minutes: CODE_MINUTES }),
    });
    return Result.ok({ codeId: id });
  }
}
