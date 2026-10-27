// SPDX-License-Identifier: AGPL-3.0-or-later
import type { MessageChannel, MessageKind } from "./outbox";
export interface UnsubscribeTarget {
  tenantId: string;
  userId: string;
  kind: Extract<MessageKind, "reminder">;
  channel: MessageChannel;
}
/** Signed links that switch one notice off without signing in. */
export abstract class UnsubscribeTokens {
  abstract sign(target: UnsubscribeTarget): string;
  abstract verify(token: string): UnsubscribeTarget | null;
}
