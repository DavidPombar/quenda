// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SessionRepository } from "../../domain/session.repository";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
@Injectable()
export class GetSession {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: { token: string }) {
    const now = this.clock.now();
    const principal = await this.sessions.find(args.token, now);
    return Result.ok({
      principal,
      expiresAt: principal ? await this.sessions.expiry(args.token, now) : null,
    });
  }
}
