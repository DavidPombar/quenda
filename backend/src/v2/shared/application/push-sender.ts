// SPDX-License-Identifier: AGPL-3.0-or-later
export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}
export interface PushMessage {
  target: PushTarget;
  /** Encrypted end to end (RFC 8291); the push service only sees its size. */
  payload: string;
  /** Replaces an undelivered message with the same topic, so a retry does not show twice. */
  topic: string;
  ttlSeconds: number;
}
/** Web Push with VAPID (RFC 8292), without any proprietary SDK. */
export abstract class PushSender {
  /** VAPID public key browsers subscribe with; null when push is not configured. */
  abstract publicKey(): string | null;
  /** Whether a subscription endpoint may be called (HTTPS push services only). */
  abstract accepts(endpoint: string): boolean;
  /**
   * Returns "gone" when the push service says the subscription no longer exists (404 or 410);
   * throws on any other failure so the message is retried.
   */
  abstract send(message: PushMessage): Promise<"sent" | "gone">;
}
