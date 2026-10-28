// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { OperatorSessionRepository } from "../../domain/operator-session.repository";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
@Injectable()
export class GetOperatorSession {
  constructor(
    private readonly sessions: OperatorSessionRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: { token: string }) {
    return Result.ok(await this.sessions.find(args.token, this.clock.now()));
  }
}
