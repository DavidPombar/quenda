// SPDX-License-Identifier: AGPL-3.0-or-later
/** Read when a pool is created, so one process can open several databases. */
export function currentDatabaseUrl() {
  return (
    process.env.DATABASE_URL ??
    "postgres://quenda:quenda_local@127.0.0.1:55432/quenda"
  );
}
export const databaseUrl = currentDatabaseUrl();
