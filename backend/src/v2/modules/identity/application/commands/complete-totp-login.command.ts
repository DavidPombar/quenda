// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { CredentialRepository } from "../../domain/credential.repository";
import {
  LOCK_MINUTES,
  MAX_FAILURES,
  ticketHash,
} from "../../domain/login-ticket";
import { fromBase32, matchingStep } from "../../domain/totp";
import { SessionRepository } from "../../domain/session.repository";
import { StaffAudit } from "../staff-audit";
import { OperatorSessionRepository } from "../../../operators/domain/operator-session.repository";
import { DataProtector } from "../../../../shared/application/data-protector";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
import { Principal } from "../../../../shared/application/principal";
import { OperatorPrincipal } from "../../../../shared/application/operator-principal";
export type TotpOutcome =
  | {
      signedIn:
        | { realm: "tenant"; token: string; principal: Principal }
        | { realm: "operator"; token: string; principal: OperatorPrincipal };
    }
  | { rejected: "code_invalid" | "account_locked" };
/**
 * Last step: the authenticator code. The first accepted code confirms the second factor; a code
 * is never accepted twice. A wrong code keeps the step open and counts towards the lock.
 */
@Injectable()
export class CompleteTotpLogin {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly sessions: SessionRepository,
    private readonly operatorSessions: OperatorSessionRepository,
    private readonly staffAudit: StaffAudit,
    private readonly protector: DataProtector,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    ticket: string;
    code: string;
  }): Promise<Result<TotpOutcome, AppError<"login_expired">>> {
    const now = this.clock.now();
    const hash = ticketHash(args.ticket);
    const ticket = await this.credentials.takeTicket(hash, now);
    const credential =
      ticket && ticket.step !== "password_change"
        ? await this.credentials.findById(ticket.credentialId)
        : null;
    const secret = credential?.totpSecret
      ? this.protector.decrypt(credential.totpSecret)
      : null;
    if (!ticket || !credential || !secret || credential.disabledAt)
      return Result.err(failure("login_expired"));
    const step = /^\s*[0-9]{6}\s*$/.test(args.code)
      ? matchingStep({
          secret: fromBase32(secret),
          code: args.code,
          epochSeconds: Math.floor(now.epochMilliseconds / 1000),
          lastStep: credential.totpLastStep,
        })
      : null;
    if (step === null) {
      const locked = credential.failedAttempts + 1 >= MAX_FAILURES;
      await this.credentials.recordFailure(
        credential.id,
        locked ? now.add({ minutes: LOCK_MINUTES }) : null,
      );
      await this.staffAudit.record(
        credential,
        locked ? "auth.locked" : "auth.failed",
        {
          step: "totp",
        },
      );
      if (locked) return Result.ok({ rejected: "account_locked" });
      await this.credentials.saveTicket({
        ticketHash: hash,
        credentialId: credential.id,
        step: ticket.step,
        expiresAt: ticket.expiresAt,
      });
      return Result.ok({ rejected: "code_invalid" });
    }
    await this.credentials.acceptTotp(credential.id, step, now);
    if (ticket.step === "enroll")
      await this.staffAudit.record(credential, "auth.second_factor_enrolled");
    await this.staffAudit.record(credential, "auth.signed_in", {
      method: "local",
    });
    const expiresAt = now.add({ hours: 8 });
    if (credential.realm === "operator") {
      const principal = await this.credentials.operatorPrincipal(
        credential.subjectId,
      );
      if (!principal) return Result.err(failure("login_expired"));
      const token = await this.operatorSessions.create(principal, expiresAt);
      return Result.ok({ signedIn: { realm: "operator", token, principal } });
    }
    const principal = await this.credentials.tenantPrincipal(
      credential.tenantId ?? "",
      credential.subjectId,
    );
    if (!principal) return Result.err(failure("login_expired"));
    const token = await this.sessions.create(principal, expiresAt);
    return Result.ok({ signedIn: { realm: "tenant", token, principal } });
  }
}
