// SPDX-License-Identifier: AGPL-3.0-or-later
import type { NoticeKind } from "./notice-preferences";
export interface UnsubscribeTarget {
  tenantId: string;
  userId: string;
  kind: NoticeKind;
  channel: "email";
  /**
   * When the preference last changed as the link was signed ("0" if never); a link only works
   * while that is still true, so an old email cannot switch off a notice the person turned back
   * on. Null for links sent before versions existed.
   */
  version: string | null;
}
/** Signed links that switch one notice off without signing in. */
export abstract class UnsubscribeTokens {
  abstract sign(target: UnsubscribeTarget & { version: string }): string;
  abstract verify(token: string): UnsubscribeTarget | null;
}
