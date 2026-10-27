// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { OperatorSessionRepository } from "../../domain/operator-session.repository";
import { Result } from "../../../../shared/application/result";
@Injectable()
export class DeleteOperatorSession {
  constructor(private readonly sessions: OperatorSessionRepository) {}
  async execute(args: { token: string }) {
    await this.sessions.remove(args.token);
    return Result.ok();
  }
}
