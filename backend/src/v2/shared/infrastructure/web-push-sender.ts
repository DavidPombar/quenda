// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from "@nestjs/common";
import webPush from "web-push";
import { PushMessage, PushSender } from "../application/push-sender";
const TIMEOUT_MS = 10000;
interface Vapid {
  subject: string;
  publicKey: string;
  privateKey: string;
}
function configured(): Vapid | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey)
    return {
      subject: process.env.VAPID_SUBJECT || "mailto:quenda@example.org",
      publicKey,
      privateKey,
    };
  if (process.env.DEMO_MODE !== "true") return null;
  // The API and the worker are separate processes and must share the pair, so the demo uses a
  // fixed one. It is public: deployments set their own keys.
  new Logger(WebPushSender.name).warn(
    "VAPID keys are not set; using the public demo pair",
  );
  return {
    subject: "mailto:demo@quenda.example",
    publicKey:
      "BJMK2qpMu353MNW8xxiPBWUJNBDUyJ7ggTqL8esk-SMWjnvO1hhQzAuqJjKCHggPuwCDAPeEK7s03TOjjdvIpPY",
    privateKey: "pV4LKOhkG5g2bgMwCokpByACfFeI3sfeoTg5gucenyI",
  };
}
/** Encrypts and signs with the `web-push` library and posts with fetch. */
@Injectable()
export class WebPushSender extends PushSender {
  private readonly vapid = configured();
  publicKey() {
    return this.vapid?.publicKey ?? null;
  }
  accepts(endpoint: string) {
    let url: URL;
    try {
      url = new URL(endpoint);
    } catch {
      return false;
    }
    if (url.protocol === "https:") return true;
    // The e2e tests stand in for the push service on the loopback interface.
    return (
      process.env.NODE_ENV === "test" &&
      url.protocol === "http:" &&
      url.hostname === "127.0.0.1"
    );
  }
  async send(message: PushMessage): Promise<"sent" | "gone"> {
    if (!this.vapid) throw new Error("push is not configured");
    if (!this.accepts(message.target.endpoint))
      throw new Error("push endpoint not allowed");
    const request = webPush.generateRequestDetails(
      {
        endpoint: message.target.endpoint,
        keys: { p256dh: message.target.p256dh, auth: message.target.auth },
      },
      message.payload,
      {
        vapidDetails: this.vapid,
        TTL: message.ttlSeconds,
        topic: message.topic,
        urgency: "normal",
      },
    );
    const response = await fetch(request.endpoint, {
      method: request.method,
      headers: Object.fromEntries(
        Object.entries(request.headers).map(([key, value]) => [
          key,
          String(value),
        ]),
      ),
      body: request.body ? new Uint8Array(request.body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "error",
    });
    if (response.status === 404 || response.status === 410) return "gone";
    if (!response.ok)
      throw new Error(`push service answered ${response.status}`);
    return "sent";
  }
}
