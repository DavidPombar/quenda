// SPDX-License-Identifier: AGPL-3.0-or-later
import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { Municipalities } from "../v2/shared/application/municipality-settings";
import { Commands } from "../v2/shared/infrastructure/commands.locator";
import { ApplyRetention } from "../v2/modules/retention/application/commands/apply-retention.command";
/** Applies each municipality's retention policy. Intended for a daily cron (e.g. 0 4 * * *). */
export async function retention() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  });
  const logger = new Logger("Retention");
  try {
    const operation = app.get(Commands).get(ApplyRetention);
    for (const municipality of await app.get(Municipalities).list()) {
      (await operation.execute({ tenantId: municipality.id })).fold(
        (summary) =>
          logger.log(
            `${municipality.slug}: cutoff ${summary.cutoff.toString()}, ` +
              `bookings detached ${summary.bookingsDetached}, ` +
              `notifications deleted ${summary.notificationsDeleted}, ` +
              `messages deleted ${summary.messagesDeleted}, ` +
              `audit pseudonymised ${summary.auditPseudonymised}, ` +
              `sessions purged ${summary.sessionsPurged}, ` +
              `consents deleted ${summary.consentsDeleted}, ` +
              `users purged ${summary.usersPurged}`,
          ),
        (error) => {
          logger.warn(`${municipality.slug}: ${error.code}`);
          process.exitCode = 1;
        },
      );
    }
  } finally {
    await app.close();
  }
}
if (require.main === module)
  void retention().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
