// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from "@nestjs/common";
import { Commands } from "../../../../shared/infrastructure/commands.locator";
import { PurgeExpiredSessions } from "../../application/commands/purge-expired-sessions.command";
/**
 * Entry point that purges expired sessions at startup and then periodically.
 * `SESSION_PURGE_MINUTES=0` disables it (for example, when an external job runs it).
 */
@Injectable()
export class SessionPurgeScheduler
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(SessionPurgeScheduler.name);
  private timer?: NodeJS.Timeout;
  constructor(private readonly commands: Commands) {}
  onApplicationBootstrap() {
    const minutes = Number(process.env.SESSION_PURGE_MINUTES ?? 60);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    void this.run();
    this.timer = setInterval(() => void this.run(), minutes * 60_000);
    this.timer.unref();
  }
  onApplicationShutdown() {
    clearInterval(this.timer);
  }
  private async run() {
    try {
      // Resolved on use: providers may not be instantiated yet at construction.
      const result = await this.commands.get(PurgeExpiredSessions).execute({});
      result.fold(
        ({ removed }) =>
          removed && this.logger.log(`Removed ${removed} expired sessions`),
        () => undefined,
      );
    } catch (error) {
      this.logger.error(`Expired session purge failed: ${String(error)}`);
    }
  }
}
