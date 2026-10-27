// SPDX-License-Identifier: AGPL-3.0-or-later
export const MAX_ATTEMPTS = 6;
export const LEASE_MINUTES = 2;
/** Exponential backoff: 2, 4, 8… minutes after each failed attempt. */
export function retryDelayMinutes(attempts: number) {
  return 2 ** attempts;
}
