// SPDX-License-Identifier: AGPL-3.0-or-later
export const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://quenda:quenda_local@127.0.0.1:55432/quenda";
