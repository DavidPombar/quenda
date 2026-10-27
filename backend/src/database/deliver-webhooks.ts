// SPDX-License-Identifier: AGPL-3.0-or-later
import "reflect-metadata";
import { setTimeout as sleep } from "node:timers/promises";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { AccessWebhookDispatcher } from "../v2/modules/access/infrastructure/webhook/access-webhook-dispatcher";
/**
 * Delivers pending access webhooks (M3). Run it from cron (e.g. every minute) or keep it running
 * with `--watch`, which polls every five seconds until interrupted.
 */
export async function deliverWebhooks(
  watch = process.argv.includes("--watch"),
) {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  });
  const logger = new Logger("AccessWebhook");
  const dispatcher = app.get(AccessWebhookDispatcher);
  let stopping = false;
  process.once("SIGINT", () => (stopping = true));
  process.once("SIGTERM", () => (stopping = true));
  try {
    do {
      let sent = 0;
      for (let batch; (batch = await dispatcher.deliverDue()) > 0;)
        sent += batch;
      if (sent) logger.log(`${sent} message(s) attempted`);
      if (watch && !stopping) await sleep(5000);
    } while (watch && !stopping);
  } finally {
    await app.close();
  }
}
if (require.main === module)
  void deliverWebhooks().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
