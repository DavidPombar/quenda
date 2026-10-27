// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import { Clock } from "../../../../shared/application/clock";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { AccessBookingRepository } from "../../domain/access-booking.repository";
import { CredentialIssuer } from "../../application/credential-issuer";
import { open } from "../crypto/key-encryption";
import { webhookSignature } from "./standard-webhook";
interface Delivery {
  id: string;
  tenant_id: string;
  booking_id: string;
  changed_at: string;
  attempts: number;
}
const maxAttempts = 10;
const lockMinutes = 2;
/**
 * Delivers the access webhook outbox after the reservation transaction has committed. Each
 * booking has at most one pending row; the message describes the booking as it is when sent:
 * a confirmed booking that has not ended issues a credential, anything else revokes it.
 */
@Injectable()
export class AccessWebhookDispatcher {
  private readonly logger = new Logger("AccessWebhook");
  constructor(
    private readonly db: Database,
    private readonly clock: Clock,
    private readonly municipalities: Municipalities,
    private readonly bookings: AccessBookingRepository,
    private readonly issuer: CredentialIssuer,
  ) {}
  /** Sends what is due, at most `limit` messages; returns how many were attempted. */
  async deliverDue(limit = 50) {
    const now = this.clock.now();
    await this.db.query(
      "DELETE FROM access_webhook_deliveries WHERE sent_at < $1",
      [now.subtract({ hours: 24 * 30 }).toString()],
    );
    const { rows } = await this.db.query<Delivery>(
      `UPDATE access_webhook_deliveries SET locked_until=$2, attempts=attempts+1
       WHERE id IN (
         SELECT id FROM access_webhook_deliveries
         WHERE sent_at IS NULL AND attempts < $3 AND available_at <= $1
           AND (locked_until IS NULL OR locked_until < $1)
         ORDER BY available_at LIMIT $4 FOR UPDATE SKIP LOCKED)
       RETURNING id, tenant_id, booking_id, changed_at, attempts`,
      [
        now.toString(),
        now.add({ minutes: lockMinutes }).toString(),
        maxAttempts,
        limit,
      ],
    );
    for (const delivery of rows) await this.deliver(delivery);
    return rows.length;
  }
  private async deliver(delivery: Delivery) {
    try {
      const target = (
        await this.db.query<{ url: string | null; secret: Buffer | null }>(
          "SELECT access_webhook_url AS url, access_webhook_secret AS secret FROM municipalities WHERE id=$1",
          [delivery.tenant_id],
        )
      ).rows[0];
      const settings = await this.municipalities.find(delivery.tenant_id);
      const booking = await this.bookings.find(
        delivery.tenant_id,
        delivery.booking_id,
      );
      if (!target?.url || !target.secret || !settings || !booking)
        return await this.finish(delivery, "skipped: webhook or booking gone");
      const now = this.clock.now();
      const active =
        booking.status === "confirmed" &&
        Temporal.Instant.compare(booking.end, now) > 0;
      const credential = active
        ? await this.issuer.issue(settings, booking)
        : null;
      const timestamp = Math.floor(now.epochMilliseconds / 1000);
      const id = `msg_${delivery.id}_${Temporal.Instant.from(delivery.changed_at).epochMilliseconds}`;
      const body = JSON.stringify({
        type: active ? "access.credential.issued" : "access.credential.revoked",
        timestamp: now.toString(),
        data: {
          municipality: settings.slug,
          bookingId: booking.id,
          facilityId: booking.facilityId,
          facilityName: booking.facilityName,
          start: booking.start.toString(),
          end: booking.end.toString(),
          status: booking.status,
          credential: credential && {
            token: credential.token,
            keyId: credential.keyId,
            notBefore: credential.notBefore.toString(),
            expiresAt: credential.expiresAt.toString(),
          },
        },
      });
      const response = await fetch(target.url, {
        method: "POST",
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
        headers: {
          "content-type": "application/json",
          "webhook-id": id,
          "webhook-timestamp": String(timestamp),
          "webhook-signature": webhookSignature({
            secret: open(
              target.secret,
              `webhook:${delivery.tenant_id}`,
            ).toString(),
            id,
            timestamp,
            body,
          }),
        },
        body,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await this.finish(delivery, null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `${delivery.id}: attempt ${delivery.attempts} failed: ${message}`,
      );
      const delay = Math.min(2 ** delivery.attempts, 360);
      await this.db.query(
        "UPDATE access_webhook_deliveries SET locked_until=NULL, last_error=$2, available_at=$3 WHERE id=$1 AND changed_at=$4",
        [
          delivery.id,
          message.slice(0, 500),
          this.clock.now().add({ minutes: delay }).toString(),
          delivery.changed_at,
        ],
      );
      await this.release(delivery);
    }
  }
  private async finish(delivery: Delivery, note: string | null) {
    // A change committed while sending supersedes this message: keep the row pending for it.
    await this.db.query(
      "UPDATE access_webhook_deliveries SET sent_at=$2, locked_until=NULL, last_error=$3 WHERE id=$1 AND changed_at=$4",
      [delivery.id, this.clock.now().toString(), note, delivery.changed_at],
    );
    await this.release(delivery);
  }
  private async release(delivery: Delivery) {
    await this.db.query(
      "UPDATE access_webhook_deliveries SET locked_until=NULL WHERE id=$1 AND changed_at<>$2",
      [delivery.id, delivery.changed_at],
    );
  }
}
