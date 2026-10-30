// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export interface LoginCode {
  id: string;
  tenantId: string;
  codeHash: string;
  legalVersion: string;
  attempts: number;
  expiresAt: Temporal.Instant;
  consumedAt: Temporal.Instant | null;
}
/** A code waiting to be mailed, leased to one sender. */
export interface PendingLoginCode {
  id: string;
  tenantId: string;
  recipient: string;
  code: string;
  locale: "gl" | "es";
  sendAttempts: number;
}
export abstract class LoginCodeRepository {
  abstract countSince(
    tenantId: string,
    emailHash: string,
    since: Temporal.Instant,
  ): Promise<number>;
  abstract add(code: {
    id: string;
    tenantId: string;
    emailHash: string;
    recipient: string;
    pendingCode: string;
    codeHash: string;
    legalVersion: string;
    locale: "gl" | "es";
    createdAt: Temporal.Instant;
    expiresAt: Temporal.Instant;
  }): Promise<void>;
  /** Locks and returns the most recent code requested for the address. */
  abstract latest(
    tenantId: string,
    emailHash: string,
  ): Promise<LoginCode | null>;
  abstract recordFailure(id: string): Promise<void>;
  abstract consume(id: string, at: Temporal.Instant): Promise<void>;
  /** Leases unsent, unexpired codes (the given one only, or any) for a couple of minutes. */
  abstract claim(args: {
    id?: string;
    now: Temporal.Instant;
    limit: number;
  }): Promise<PendingLoginCode[]>;
  /** Clears the address and the code in clear once handed to the mail server. */
  abstract markSent(id: string, at: Temporal.Instant): Promise<void>;
  abstract markFailed(id: string, error: string): Promise<void>;
}
