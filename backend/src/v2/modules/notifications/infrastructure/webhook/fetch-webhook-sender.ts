// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { WebhookCall, WebhookSender } from "../../application/webhook-sender";
const TIMEOUT_MS = 10000;
@Injectable()
export class FetchWebhookSender extends WebhookSender {
  async send(call: WebhookCall) {
    const response = await fetch(call.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Quenda-Access-Webhook/1",
        "X-Quenda-Delivery": call.id,
        "X-Quenda-Signature": `sha256=${call.signature}`,
      },
      body: call.body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "error",
    });
    if (!response.ok) throw new Error(`webhook answered ${response.status}`);
  }
}
