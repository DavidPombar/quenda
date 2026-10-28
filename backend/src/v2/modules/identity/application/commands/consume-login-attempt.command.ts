// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import {
  LoginAttempt,
  LoginAttemptRepository,
} from "../../domain/login-attempt.repository";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type ConsumeLoginAttemptError =
  AppError<"login_rejected"> | AppError<"login_expired">;
/**
 * Removes a pending OIDC attempt before its code is redeemed, so each state works once at most.
 * It commits on its own because the network exchange that follows must run outside a transaction.
 * An expired attempt is rejected (the rollback leaves it for retention to purge).
 */
@Injectable()
export class ConsumeLoginAttempt {
  constructor(
    private readonly attempts: LoginAttemptRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    state: string;
  }): Promise<
    Result<{ attempt: LoginAttempt; slug: string }, ConsumeLoginAttemptError>
  > {
    const attempt = await this.attempts.take(args.state);
    if (!attempt) return Result.err(failure("login_rejected"));
    if (Temporal.Instant.compare(attempt.expiresAt, this.clock.now()) <= 0)
      return Result.err(failure("login_expired"));
    const municipality = await this.municipalities.find(attempt.tenantId);
    if (!municipality) return Result.err(failure("login_rejected"));
    return Result.ok({ attempt, slug: municipality.slug });
  }
}
