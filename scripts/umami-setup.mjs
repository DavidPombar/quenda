// SPDX-License-Identifier: AGPL-3.0-or-later
// Prepares the deployment's Umami for Quenda (#57) and prints the UMAMI_* variables for .env:
// one website per site (citizen app and public website) in a "Quenda" team, and a read-only
// user in that team for the dashboards. Safe to run again: it reuses what already exists.
//
//   UMAMI_URL=http://127.0.0.1:8095 UMAMI_ADMIN_PASSWORD=umami npm run analytics:setup
import { randomBytes } from "node:crypto";
const base = (process.env.UMAMI_URL ?? "http://127.0.0.1:8095").replace(
  /\/+$/,
  "",
);
const admin = {
  username: process.env.UMAMI_ADMIN_USERNAME ?? "admin",
  password: process.env.UMAMI_ADMIN_PASSWORD ?? "umami",
};
const readerName = process.env.UMAMI_READER_USERNAME ?? "quenda-lector";
const TEAM = "Quenda";
const SITES = { app: "Quenda app", web: "Quenda web" };
async function call(token, method, path, body) {
  const response = await fetch(`${base}/api/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok)
    throw new Error(`${method} /api/${path} answered ${response.status}`);
  return response.json();
}
const list = (value) => (Array.isArray(value) ? value : (value?.data ?? []));
const { token } = await call(null, "POST", "auth/login", admin);
const teams = list(await call(token, "GET", "me/teams"));
let team = teams.find((item) => item.name === TEAM);
if (!team) {
  // Umami answers with the team and the owner's membership.
  const created = await call(token, "POST", "teams", { name: TEAM });
  team = Array.isArray(created) ? created[0] : created;
}
const websites = list(
  await call(token, "GET", `teams/${team.id}/websites?pageSize=100`),
);
const ids = {};
for (const [app, name] of Object.entries(SITES)) {
  const existing = websites.find((item) => item.name === name);
  ids[app] = existing
    ? existing.id
    : (
        await call(token, "POST", "websites", {
          name,
          domain: `${app}.quenda.local`,
          teamId: team.id,
        })
      ).id;
}
const users = list(await call(token, "GET", "admin/users?pageSize=200"));
let reader = users.find((item) => item.username === readerName);
let password = process.env.UMAMI_READER_PASSWORD;
if (!reader) {
  password ??= randomBytes(18).toString("base64url");
  reader = await call(token, "POST", "users", {
    username: readerName,
    password,
    role: "view-only",
  });
}
const members = list(await call(token, "GET", `teams/${team.id}/users`));
if (
  !members.some(
    (item) => (item.userId ?? item.user?.id ?? item.id) === reader.id,
  )
)
  await call(token, "POST", `teams/${team.id}/users`, {
    userId: reader.id,
    role: "team-view-only",
  });
console.log(`UMAMI_URL=${base}
UMAMI_APP_WEBSITE_ID=${ids.app}
UMAMI_WEB_WEBSITE_ID=${ids.web}
UMAMI_USERNAME=${readerName}
UMAMI_PASSWORD=${password ?? "<the password chosen when the user was created>"}`);
