// SPDX-License-Identifier: AGPL-3.0-or-later
// Verifies the deployed container's security headers and session cookie (T4).
// Usage: HEADERS_URL=http://127.0.0.1:8080 [EXPECT_SECURE_COOKIE=true] npm run test:headers
import assert from "node:assert/strict";
const base = process.env.HEADERS_URL ?? "http://127.0.0.1:8080";
const expectSecure = process.env.EXPECT_SECURE_COOKIE === "true";
async function head(path, init) {
  const response = await fetch(new URL(path, base), {
    redirect: "manual",
    ...init,
  });
  return response;
}
for (const path of ["/", "/app/", "/app/reservas", "/admin/", "/admin/x"]) {
  const response = await head(path);
  assert.equal(response.status, 200, `${path} status`);
  const csp = response.headers.get("content-security-policy") ?? "";
  for (const directive of [
    "default-src 'self'",
    "script-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ])
    assert.ok(csp.includes(directive), `${path} CSP lacks ${directive}`);
  assert.ok(
    csp.includes(
      path.startsWith("/admin/")
        ? "worker-src 'self' blob:"
        : "worker-src 'self';",
    ),
    `${path} scanner worker policy`,
  );
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/, `${path} CSP`);
  // The facility map loads tiles from the configured server and nothing else (#26).
  assert.match(
    csp,
    /img-src 'self' data: blob: https:\/\/[^\s;]+;/,
    `${path} map tiles`,
  );
  assert.equal(response.headers.get("x-frame-options"), "DENY", path);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.ok(
    response.headers
      .get("permissions-policy")
      ?.includes(path.startsWith("/admin/") ? "camera=(self)" : "camera=()"),
    `${path} camera policy`,
  );
  assert.doesNotMatch(response.headers.get("server") ?? "", /\d/, "version");
}
// Installed apps pick up a new version on their next start (#24).
for (const path of [
  "/app/sw.js",
  "/app/manifest.webmanifest",
  "/admin/sw.js",
  "/admin/manifest.webmanifest",
]) {
  const response = await head(path);
  assert.equal(response.status, 200, `${path} status`);
  assert.equal(response.headers.get("cache-control"), "no-cache", path);
}
const api = await head("/v2/public/municipalities");
assert.equal(api.status, 200);
// API headers come only from the API, without conflicting proxy duplicates.
assert.equal(api.headers.get("x-frame-options"), "SAMEORIGIN");
assert.equal(api.headers.get("cache-control"), "no-store");
assert.ok(api.headers.get("x-ratelimit-limit-requests"), "rate limit");
const [{ slug, legalVersion }] = await api.json();
const session = await head("/v2/public/sessions", {
  method: "POST",
  headers: { "content-type": "application/json", "x-quenda-request": "1" },
  body: JSON.stringify({ slug, role: "citizen", legalVersion }),
});
const cookie = session.headers.get("set-cookie") ?? "";
if (session.status === 201) {
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.equal(/;\s*Secure/i.test(cookie), expectSecure, "Secure cookie flag");
} else assert.equal(session.status, 403, "demo login disabled");
console.log(`Security headers verified at ${base}.`);
