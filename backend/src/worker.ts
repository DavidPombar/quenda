// SPDX-License-Identifier: AGPL-3.0-or-later
import "reflect-metadata";
import { setTimeout as sleep } from "node:timers/promises";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DeliveryWorker } from "./v2/modules/notifications/infrastructure/worker/delivery-worker";
/**
 * Delivers queued notices and schedules reminders. Runs as its own process next to the API;
 * `--once` performs a single pass (useful for cron or checks).
 */
export async function worker(once = process.argv.includes("--once")) {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  });
  const logger = new Logger("Worker");
  const interval = Number(process.env.WORKER_INTERVAL_MS ?? 15000);
  let running = true;
  const stop = () => {
    running = false;
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  try {
    const delivery = app.get(DeliveryWorker);
    logger.log(once ? "single pass" : `polling every ${interval} ms`);
    do {
      try {
        await delivery.runOnce();
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        if (once) process.exitCode = 1;
      }
      if (!once && running) await sleep(interval);
    } while (!once && running);
  } finally {
    await app.close();
  }
}
if (require.main === module)
  void worker().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
