// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash } from "node:crypto";
/** A sign-in step stays open ten minutes; five failures lock the account for fifteen. */
export const TICKET_MINUTES = 10;
export const MAX_FAILURES = 5;
export const LOCK_MINUTES = 15;
export function ticketHash(ticket: string) {
  return createHash("sha256").update(ticket).digest("hex");
}
