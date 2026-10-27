// SPDX-License-Identifier: AGPL-3.0-or-later
export interface WebhookCall {
  /** Outbox id, sent as X-Quenda-Delivery so receivers can ignore repeats. */
  id: string;
  url: string;
  body: string;
  /** Hex HMAC-SHA256 of the body with the municipality's secret. */
  signature: string;
}
export abstract class WebhookSender {
  /** Throws unless the receiver answered with a 2xx status. */
  abstract send(call: WebhookCall): Promise<void>;
}
