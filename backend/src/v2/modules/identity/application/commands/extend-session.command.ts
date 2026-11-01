// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import type { Temporal } from "@js-temporal/polyfill";
import { SessionRepository } from "../../domain/session.repository";
import { SESSION_HOURS } from "../../domain/session-duration";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Keeps a live session open for another eight hours when the person asks (WCAG 2.2.1). */
@Injectable()
export class ExtendSession {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    token: string;
  }): Promise<Result<Temporal.Instant, AppError<"unauthorized">>> {
    const now = this.clock.now();
    const until = now.add({ hours: SESSION_HOURS });
    return (await this.sessions.extend(args.token, now, until))
      ? Result.ok(until)
      : Result.err(failure("unauthorized"));
  }
}
