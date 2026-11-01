// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import type { Temporal } from "@js-temporal/polyfill";
import { CredentialRepository } from "../../domain/credential.repository";
import { TICKET_MINUTES, ticketHash } from "../../domain/login-ticket";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/**
 * More time for the step between the password and the second factor (WCAG 2.2.1): the same
 * ticket, and the same authenticator secret, for another ten minutes.
 */
@Injectable()
export class ExtendLoginTicket {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    ticket: string;
  }): Promise<Result<Temporal.Instant, AppError<"login_expired">>> {
    const now = this.clock.now();
    const until = now.add({ minutes: TICKET_MINUTES });
    return (await this.credentials.extendTicket(
      ticketHash(args.ticket),
      now,
      until,
    ))
      ? Result.ok(until)
      : Result.err(failure("login_expired"));
  }
}
