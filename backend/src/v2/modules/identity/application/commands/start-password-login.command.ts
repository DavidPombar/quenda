// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import {
  Credential,
  CredentialRepository,
  Realm,
} from "../../domain/credential.repository";
import {
  hashPassword,
  normaliseLogin,
  verifyPassword,
} from "../../domain/password";
import { LOCK_MINUTES, MAX_FAILURES } from "../../domain/login-ticket";
import { CredentialIssuer } from "../credential-issuer";
import { NextStep, StaffLogin } from "../staff-login";
import { StaffAudit } from "../staff-audit";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type StaffLoginError =
  AppError<"not_found"> | AppError<"local_accounts_unavailable">;
/** Wrong passwords commit their count, so they are outcomes rather than errors. */
export type PasswordOutcome =
  { next: NextStep } | { rejected: "login_rejected" | "account_locked" };
/** Spent on unknown logins too, so the answer time does not reveal which logins exist. */
let decoy: Promise<string> | undefined;
/**
 * First step of a staff sign-in (#8, part C): login and password. A wrong password and an unknown
 * login answer the same; five failures lock the account for fifteen minutes.
 */
@Injectable()
export class StartPasswordLogin {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly issuer: CredentialIssuer,
    private readonly steps: StaffLogin,
    private readonly staffAudit: StaffAudit,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    realm: Realm;
    slug?: string;
    login: string;
    password: string;
  }): Promise<Result<PasswordOutcome, StaffLoginError>> {
    if (!this.issuer.available())
      return Result.err(failure("local_accounts_unavailable"));
    let tenantId: string | null = null;
    if (args.realm === "tenant") {
      const municipality = args.slug
        ? await this.municipalities.findBySlug(args.slug)
        : null;
      if (!municipality) return Result.err(failure("not_found"));
      tenantId = municipality.id;
    }
    const now = this.clock.now();
    const login = normaliseLogin(args.login);
    const credential = login
      ? await this.credentials.findByLogin(args.realm, tenantId, login)
      : null;
    if (
      credential?.lockedUntil &&
      Temporal.Instant.compare(credential.lockedUntil, now) > 0
    )
      return Result.ok({ rejected: "account_locked" });
    const valid = await verifyPassword(
      args.password,
      credential?.passwordHash ??
        (await (decoy ??= hashPassword("decoy password"))),
    );
    if (!credential || credential.disabledAt)
      return Result.ok({ rejected: "login_rejected" });
    if (!valid)
      return Result.ok({ rejected: await this.fail(credential, now) });
    await this.credentials.clearFailures(credential.id);
    return Result.ok({ next: await this.steps.next(credential) });
  }
  private async fail(credential: Credential, now: Temporal.Instant) {
    const locked = credential.failedAttempts + 1 >= MAX_FAILURES;
    await this.credentials.recordFailure(
      credential.id,
      locked ? now.add({ minutes: LOCK_MINUTES }) : null,
    );
    await this.staffAudit.record(
      credential,
      locked ? "auth.locked" : "auth.failed",
      {
        step: "password",
      },
    );
    return locked ? ("account_locked" as const) : ("login_rejected" as const);
  }
}
