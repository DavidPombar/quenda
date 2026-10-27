// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
/** Every operation is scoped to one tenant and returns the number of affected rows. */
export abstract class RetentionRepository {
  /** Unlinks reservations that ended before the cutoff from their person. */
  abstract detachBookings(
    tenantId: string,
    cutoff: Temporal.Instant,
  ): Promise<number>;
  abstract deleteNotifications(
    tenantId: string,
    cutoff: Temporal.Instant,
  ): Promise<number>;
  /** Removes booking bans that ended before the cutoff. */
  abstract deleteBlocks(
    tenantId: string,
    cutoff: Temporal.Instant,
  ): Promise<number>;
  /** Keeps old audit events but removes the link to their actor. */
  abstract pseudonymiseAudit(
    tenantId: string,
    cutoff: Temporal.Instant,
  ): Promise<number>;
  abstract purgeSessions(
    tenantId: string,
    now: Temporal.Instant,
  ): Promise<number>;
  /** Removes OIDC sign-in attempts that were never completed. */
  abstract purgeLoginAttempts(
    tenantId: string,
    now: Temporal.Instant,
  ): Promise<number>;
  abstract deleteConsentsOfPurgedUsers(
    tenantId: string,
    cutoff: Temporal.Instant,
  ): Promise<number>;
  /** Removes accounts deleted before the cutoff that no other row references any more. */
  abstract purgeDeletedUsers(
    tenantId: string,
    cutoff: Temporal.Instant,
  ): Promise<number>;
}
