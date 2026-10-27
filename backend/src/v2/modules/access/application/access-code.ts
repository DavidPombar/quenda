// SPDX-License-Identifier: AGPL-3.0-or-later
/** Eight characters of the reservation id, readable aloud at the desk. */
export function accessCode(bookingId: string) {
  return bookingId.replaceAll("-", "").slice(0, 8).toUpperCase();
}
