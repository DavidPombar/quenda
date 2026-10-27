// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from "@nestjs/common";
import { Commands } from "../../../../shared/infrastructure/commands.locator";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { UnsubscribeTokens } from "../../../../shared/application/unsubscribe-tokens";
import { ScheduleReminders } from "../../application/commands/schedule-reminders.command";
import { ClaimDeliveries } from "../../application/commands/claim-deliveries.command";
import { CompleteDelivery } from "../../application/commands/complete-delivery.command";
import { Mailer } from "../../application/mailer";
import { Delivery } from "../../domain/delivery.read-model";
import { renderMail } from "../mail/templates";
const BATCH_SIZE = 50;
/**
 * One pass of the delivery loop: queue due reminders, lease pending messages, send each one
 * outside any transaction and record the outcome. Delivery is at-least-once; the Message-ID
 * repeats if a crash happens between sending and recording.
 */
@Injectable()
export class DeliveryWorker {
  private readonly logger = new Logger(DeliveryWorker.name);
  private readonly baseUrl = (
    process.env.APP_BASE_URL ?? "http://127.0.0.1:5173"
  ).replace(/\/$/, "");
  constructor(
    private readonly commands: Commands,
    private readonly municipalities: Municipalities,
    private readonly mailer: Mailer,
    private readonly tokens: UnsubscribeTokens,
  ) {}
  async runOnce() {
    let reminders = 0;
    for (const municipality of await this.municipalities.list())
      reminders += (
        await this.commands
          .get(ScheduleReminders)
          .execute({ tenantId: municipality.id })
      ).fold(
        (count) => count,
        () => 0,
      );
    const deliveries = (
      await this.commands.get(ClaimDeliveries).execute({ limit: BATCH_SIZE })
    ).fold(
      (value) => value,
      () => [],
    );
    let sent = 0;
    for (const delivery of deliveries) {
      const error = await this.deliver(delivery);
      if (!error) sent += 1;
      await this.commands
        .get(CompleteDelivery)
        .execute({ id: delivery.id, attempts: delivery.attempts, error });
    }
    if (reminders || deliveries.length)
      this.logger.log(
        `reminders queued ${reminders}, sent ${sent}/${deliveries.length}`,
      );
    return { reminders, sent, failed: deliveries.length - sent };
  }
  private async deliver(delivery: Delivery): Promise<string | undefined> {
    const slug = encodeURIComponent(delivery.municipality.slug);
    const unsubscribe =
      delivery.kind === "reminder"
        ? `${this.baseUrl}/app/${slug}/baixa?token=${this.tokens.sign({
            tenantId: delivery.tenantId,
            userId: delivery.userId,
            kind: "reminder",
            channel: "email",
          })}`
        : null;
    const mail = renderMail(delivery, {
      bookings: `${this.baseUrl}/app/${slug}/reservas`,
      unsubscribe,
    });
    try {
      await this.mailer.send({
        id: delivery.id,
        to: delivery.email ?? "",
        fromName: delivery.municipality.senderName,
        replyTo: delivery.municipality.replyTo,
        ...mail,
        headers: unsubscribe ? { "List-Unsubscribe": `<${unsubscribe}>` } : {},
      });
      return undefined;
    } catch (error) {
      this.logger.warn(`delivery ${delivery.id} failed`);
      return error instanceof Error ? error.message : String(error);
    }
  }
}
