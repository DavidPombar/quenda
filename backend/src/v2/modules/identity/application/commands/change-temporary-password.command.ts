// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { CredentialRepository } from "../../domain/credential.repository";
import { acceptablePassword, hashPassword } from "../../domain/password";
import { ticketHash } from "../../domain/login-ticket";
import { NextStep, StaffLogin } from "../staff-login";
import { StaffAudit } from "../staff-audit";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Replaces the temporary password before the second factor (#8, part C). */
@Injectable()
export class ChangeTemporaryPassword {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly steps: StaffLogin,
    private readonly staffAudit: StaffAudit,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    ticket: string;
    newPassword: string;
  }): Promise<
    Result<NextStep, AppError<"login_expired"> | AppError<"password_weak">>
  > {
    const now = this.clock.now();
    const ticket = await this.credentials.takeTicket(
      ticketHash(args.ticket),
      now,
    );
    const credential =
      ticket?.step === "password_change"
        ? await this.credentials.findById(ticket.credentialId)
        : null;
    if (!credential || credential.disabledAt)
      return Result.err(failure("login_expired"));
    // An error rolls the ticket back, so the person can try another password.
    if (!acceptablePassword(args.newPassword, credential.login))
      return Result.err(failure("password_weak"));
    await this.credentials.setPassword(
      credential.id,
      await hashPassword(args.newPassword),
      false,
      now,
    );
    await this.staffAudit.record(credential, "auth.password_changed");
    return Result.ok(
      await this.steps.next({ ...credential, mustChangePassword: false }),
    );
  }
}
