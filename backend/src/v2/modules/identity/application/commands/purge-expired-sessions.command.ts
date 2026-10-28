// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SessionRepository } from "../../domain/session.repository";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
/** Expired sessions no longer authenticate; deleting them limits retained data (T4). */
@Injectable()
export class PurgeExpiredSessions {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
  ) {}
  async execute(_args: Record<string, never>) {
    const removed = await this.sessions.removeExpired(this.clock.now());
    return Result.ok({ removed });
  }
}
