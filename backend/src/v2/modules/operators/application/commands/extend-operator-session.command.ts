// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import type { Temporal } from "@js-temporal/polyfill";
import { OperatorSessionRepository } from "../../domain/operator-session.repository";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Keeps a live operator session open for another eight hours when asked (WCAG 2.2.1). */
@Injectable()
export class ExtendOperatorSession {
  constructor(
    private readonly sessions: OperatorSessionRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    token: string;
  }): Promise<Result<Temporal.Instant, AppError<"unauthorized">>> {
    const now = this.clock.now();
    const until = now.add({ hours: 8 });
    return (await this.sessions.extend(args.token, now, until))
      ? Result.ok(until)
      : Result.err(failure("unauthorized"));
  }
}
