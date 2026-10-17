// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SessionRepository } from "../../domain/session.repository";
import { Result } from "../../../../shared/application/result";
@Injectable()
export class DeleteSession {
  constructor(private readonly sessions: SessionRepository) {}
  async execute(args: { token: string }) {
    await this.sessions.remove(args.token);
    return Result.ok();
  }
}
