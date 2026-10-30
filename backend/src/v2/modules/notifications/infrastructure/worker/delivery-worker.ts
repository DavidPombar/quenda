// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash, createHmac } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { Commands } from "../../../../shared/infrastructure/commands.locator";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { UnsubscribeTokens } from "../../../../shared/application/unsubscribe-tokens";
import { SecretBox } from "../../../../shared/application/secret-box";
import { PushSender } from "../../../../shared/application/push-sender";
import { noticeKindOf } from "../../../../shared/application/notice-preferences";
import { DeliveryRepository } from "../../domain/delivery.repository";
import { AccessWindow } from "../../../access/application/access-window";
import { WebhookSender } from "../../application/webhook-sender";
import { ScheduleReminders } from "../../application/commands/schedule-reminders.command";
import { ClaimDeliveries } from "../../application/commands/claim-deliveries.command";
import { CompleteDelivery } from "../../application/commands/complete-delivery.command";
import { Mailer } from "../../application/mailer";
import { Delivery } from "../../domain/delivery.read-model";
import { renderMail } from "../mail/templates";
import { pushPayload } from "../push/push-texts";
const BATCH_SIZE = 50;
/** A push notice older than a day is no longer useful; the history keeps it. */
const PUSH_TTL_SECONDS = 24 * 60 * 60;
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
    private readonly webhooks: WebhookSender,
    private readonly secrets: SecretBox,
    private readonly window: AccessWindow,
    private readonly push: PushSender,
    private readonly devices: DeliveryRepository,
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
    try {
      if (delivery.channel === "webhook") await this.callWebhook(delivery);
      else if (delivery.channel === "push") await this.sendPush(delivery);
      else await this.sendMail(delivery);
      return undefined;
    } catch (error) {
      this.logger.warn(`delivery ${delivery.id} failed`);
      return error instanceof Error ? error.message : String(error);
    }
  }
  /**
   * Tells the council's access-control system that a reservation now opens the door
   * (credential.granted) or no longer does (credential.revoked). Never carries personal data.
   */
  private async callWebhook(delivery: Delivery) {
    if (!delivery.webhook) return;
    const granted =
      delivery.bookingStatus === "confirmed" &&
      (delivery.kind === "confirmed" || delivery.kind === "rescheduled");
    const window = this.window.of({
      openingCalendar: delivery.openingCalendar,
      timezone: delivery.municipality.timezone,
      start: delivery.start,
      end: delivery.end,
    });
    const body = JSON.stringify({
      event: granted ? "credential.granted" : "credential.revoked",
      reason: delivery.kind,
      municipality: delivery.municipality.slug,
      bookingId: delivery.bookingId,
      facilityId: delivery.facilityId,
      validFrom: window.from.toString(),
      validUntil: window.until.toString(),
    });
    await this.webhooks.send({
      id: delivery.id,
      url: delivery.webhook.url,
      body,
      signature: createHmac(
        "sha256",
        this.secrets.open(delivery.webhook.secretSealed),
      )
        .update(body)
        .digest("hex"),
    });
  }
  /**
   * Sends to every device of the person. Devices the push service no longer knows are forgotten;
   * the message fails, to be retried, only when no device got it and one failed for another
   * reason. A retry reuses the topic, so a device that already has the notice is not shown it
   * twice while it is pending.
   */
  private async sendPush(delivery: Delivery) {
    const slug = encodeURIComponent(delivery.municipality.slug);
    const payload = JSON.stringify(
      pushPayload(delivery, `/app/${slug}/reservas`),
    );
    const topic = createHash("sha256")
      .update(delivery.id)
      .digest("base64url")
      .slice(0, 32);
    let delivered = false;
    let failure: unknown;
    for (const device of await this.devices.pushDevices(
      delivery.tenantId,
      delivery.userId,
    )) {
      try {
        const outcome = await this.push.send({
          target: device,
          payload,
          topic,
          ttlSeconds: PUSH_TTL_SECONDS,
        });
        if (outcome === "gone")
          await this.devices.forgetPushDevice(delivery.tenantId, device.id);
        else delivered = true;
      } catch (error) {
        failure = error;
      }
    }
    if (!delivered && failure) throw failure;
  }
  private async sendMail(delivery: Delivery) {
    const slug = encodeURIComponent(delivery.municipality.slug);
    const unsubscribe = `${this.baseUrl}/app/${slug}/baixa?token=${this.tokens.sign(
      {
        tenantId: delivery.tenantId,
        userId: delivery.userId,
        kind: noticeKindOf(delivery.kind),
        channel: "email",
        version: delivery.preferenceVersion,
      },
    )}`;
    const mail = renderMail(delivery, {
      bookings: `${this.baseUrl}/app/${slug}/reservas`,
      unsubscribe,
    });
    await this.mailer.send({
      id: delivery.id,
      to: delivery.email ?? "",
      fromName: delivery.municipality.senderName,
      replyTo: delivery.municipality.replyTo,
      ...mail,
      headers: { "List-Unsubscribe": `<${unsubscribe}>` },
    });
  }
}
