// SPDX-License-Identifier: AGPL-3.0-or-later
import type { MessageKind } from "./outbox";
/** The notices a person can choose, each covering one or more outbox message kinds. */
export const noticeKinds = [
  "confirmation",
  "change",
  "cancellation",
  "reminder",
  "penalty",
] as const;
export type NoticeKind = (typeof noticeKinds)[number];
/** Channels a person chooses; the in-app notice is the history (C4) and is always kept. */
export const noticeChannels = ["email", "push"] as const;
export type NoticeChannel = (typeof noticeChannels)[number];
export type NoticePreferences = Record<
  NoticeKind,
  Record<NoticeChannel, boolean>
>;
const noticeOf: Record<MessageKind, NoticeKind> = {
  confirmed: "confirmation",
  rescheduled: "change",
  cancelled: "cancellation",
  cancelled_by_municipality: "cancellation",
  reminder: "reminder",
  no_show: "penalty",
  blocked: "penalty",
  unblocked: "penalty",
};
export function noticeKindOf(kind: MessageKind): NoticeKind {
  return noticeOf[kind];
}
/**
 * Service notices go out by email unless switched off; penalty notices only when asked for.
 * Push is on for service notices, but only reaches people who enabled it on a device.
 */
export const DEFAULT_PREFERENCES: NoticePreferences = {
  confirmation: { email: true, push: true },
  change: { email: true, push: true },
  cancellation: { email: true, push: true },
  reminder: { email: true, push: true },
  penalty: { email: false, push: false },
};
export interface StoredPreference {
  kind: NoticeKind;
  channel: NoticeChannel;
  enabled: boolean;
}
/** Stored choices over the defaults. */
export function resolvePreferences(
  rows: StoredPreference[],
): NoticePreferences {
  const resolved = Object.fromEntries(
    noticeKinds.map((kind) => [kind, { ...DEFAULT_PREFERENCES[kind] }]),
  ) as NoticePreferences;
  for (const row of rows) resolved[row.kind][row.channel] = row.enabled;
  return resolved;
}
/** Whether a message of this kind goes out on the channel, given the stored choice if any. */
export function wants(
  kind: MessageKind,
  channel: NoticeChannel,
  stored: boolean | null,
) {
  return stored ?? DEFAULT_PREFERENCES[noticeKindOf(kind)][channel];
}
