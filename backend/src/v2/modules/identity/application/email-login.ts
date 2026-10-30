// SPDX-License-Identifier: AGPL-3.0-or-later
/** Whether this deployment offers sign-in by email code (#8): on unless EMAIL_LOGIN=false. */
export function emailLoginEnabled() {
  return process.env.EMAIL_LOGIN !== "false";
}
