// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
/**
 * Registered JWT claims of a temporary access credential (M3). It carries no personal data: the
 * door only needs to know which booking and space it opens and when.
 */
export interface AccessClaims {
  /** Municipality slug. */
  iss: string;
  /** Booking UUID. */
  sub: string;
  /** Facility UUID. */
  fac: string;
  /** Seconds since the epoch: the space opens on the booking's local day. */
  nbf: number;
  /** Seconds since the epoch: the booking ends. */
  exp: number;
}
export type CredentialCheck = "valid" | "not_yet_valid" | "expired";
/**
 * Valid on the booking's day, from the space's first opening until the booking ends. Without an
 * opening that day (a calendar edited since), it opens with the booking itself.
 */
export function credentialWindow(args: {
  start: Temporal.Instant;
  end: Temporal.Instant;
  openings: readonly { start: Temporal.Instant }[];
}) {
  const opening = args.openings
    .map((interval) => interval.start)
    .filter((value) => Temporal.Instant.compare(value, args.start) <= 0)
    .sort(Temporal.Instant.compare)[0];
  return { notBefore: opening ?? args.start, expiresAt: args.end };
}
export function checkWindow(
  claims: Pick<AccessClaims, "nbf" | "exp">,
  at: Temporal.Instant,
): CredentialCheck {
  const seconds = at.epochMilliseconds / 1000;
  if (seconds < claims.nbf) return "not_yet_valid";
  if (seconds >= claims.exp) return "expired";
  return "valid";
}
export function toEpochSeconds(value: Temporal.Instant) {
  return Math.floor(value.epochMilliseconds / 1000);
}
