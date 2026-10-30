// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { type AddressInfo } from "node:net";
import { createServer, type IncomingHttpHeaders, type Server } from "node:http";
import request from "supertest";
import {
  type Tenant,
  harness,
  patch,
  post,
  setupWith,
  teardown,
  tenant,
} from "./harness";
const APP = randomUUID();
const WEB = randomUUID();
interface Call {
  method: string;
  path: string;
  query: URLSearchParams;
  headers: IncomingHttpHeaders;
  body: Record<string, unknown> | null;
}
/** Stands in for the deployment's Umami: collection, login and the statistics endpoints. */
const umami = {
  calls: [] as Call[],
  /** Answers 401 to the next statistics request, as after a restart. */
  expireToken: false,
  down: false,
  server: null as Server | null,
};
function respond(call: Call): [number, unknown] {
  if (umami.down) return [500, {}];
  if (call.path === "/api/send") return [200, {}];
  if (call.path === "/api/auth/login")
    return call.body?.username === "lector" && call.body.password === "segredo"
      ? [200, { token: `token-${umami.calls.length}` }]
      : [401, {}];
  if (umami.expireToken) {
    umami.expireToken = false;
    return [401, {}];
  }
  const tag = call.query.get("tag");
  if (call.path.endsWith("/stats"))
    return [
      200,
      tag
        ? { pageviews: 12, visitors: 4, visits: 5, bounces: 2, totaltime: 600 }
        : {
            pageviews: 40,
            visitors: 10,
            visits: 16,
            bounces: 4,
            totaltime: 1600,
          },
    ];
  if (call.path.endsWith("/metrics"))
    return [
      200,
      call.query.get("type") === "event"
        ? [{ x: "booking-confirmed", y: 3 }]
        : [{ x: `${call.query.get("type")}-a`, y: 7 }],
    ];
  return [404, {}];
}
async function startUmami() {
  umami.server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const url = new URL(req.url ?? "/", "http://umami");
      const text = Buffer.concat(chunks).toString();
      const call: Call = {
        method: req.method ?? "",
        path: url.pathname,
        query: url.searchParams,
        headers: req.headers,
        body: text ? (JSON.parse(text) as Record<string, unknown>) : null,
      };
      umami.calls.push(call);
      const [status, body] = respond(call);
      res
        .writeHead(status, { "Content-Type": "application/json" })
        .end(JSON.stringify(body));
    });
  });
  await new Promise<void>((resolve) =>
    umami.server!.listen(0, "127.0.0.1", resolve),
  );
  return `http://127.0.0.1:${(umami.server!.address() as AddressInfo).port}`;
}
beforeAll(async () => {
  const url = await startUmami();
  await setupWith({
    env: () => ({
      UMAMI_URL: url,
      UMAMI_APP_WEBSITE_ID: APP,
      UMAMI_WEB_WEBSITE_ID: WEB,
      UMAMI_USERNAME: "lector",
      UMAMI_PASSWORD: "segredo",
    }),
  });
});
afterAll(async () => {
  await teardown();
  await new Promise((resolve) => umami.server?.close(resolve));
});
function hit(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  const call = request(harness.app.getHttpServer())
    .post("/v2/public/analytics/pageview")
    .set("X-Quenda-Request", "1")
    .set("User-Agent", "Mozilla/5.0 (test browser)");
  for (const [name, value] of Object.entries(headers)) call.set(name, value);
  return call.send({ language: "gl", screen: "390x844", ...body });
}
async function sent(count: number) {
  for (let i = 0; i < 50; i++) {
    if (umami.calls.filter((call) => call.path === "/api/send").length >= count)
      break;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return umami.calls
    .filter((call) => call.path === "/api/send")
    .map((call) => call.body?.payload as Record<string, unknown>);
}
async function switchOn(context: Tenant) {
  const saved = await patch(context.manager, "manager/municipality", {
    analyticsEnabled: true,
  }).expect(200);
  expect(saved.body.settings).toMatchObject({
    analyticsEnabled: true,
    analyticsAvailable: true,
    analytics: true,
  });
}
describe("Web analytics in the deployment's Umami", () => {
  it("should count the app only for councils that switched it on, tagged with the council", async () => {
    umami.calls = [];
    const context = await tenant();
    const path = `/app/${context.slug}/instalacions/${randomUUID()}?data=2026-11-02`;
    await hit({ app: "app", slug: context.slug, path }).expect(204);
    await switchOn(context);
    const listed = await context.citizen
      .get("/v2/public/municipalities")
      .expect(200);
    expect(
      (listed.body as { slug: string; analytics: boolean }[]).find(
        (item) => item.slug === context.slug,
      ),
    ).toMatchObject({ analytics: true });
    await hit({ app: "app", slug: context.slug, path }).expect(204);
    await hit({
      app: "app",
      slug: context.slug,
      path: `/app/${context.slug}/reservas`,
      event: "booking-confirmed",
    }).expect(204);
    const payloads = await sent(2);
    expect(payloads).toEqual([
      expect.objectContaining({
        website: APP,
        url: `/app/${context.slug}/instalacions/:id`,
        tag: context.slug,
      }),
      expect.objectContaining({
        website: APP,
        tag: context.slug,
        name: "booking-confirmed",
      }),
    ]);
    expect(payloads[0]).not.toHaveProperty("name");
    const send = umami.calls.find((call) => call.path === "/api/send")!;
    expect(send.headers["user-agent"]).toBe("Mozilla/5.0 (test browser)");
    expect(send.headers["x-forwarded-for"]).toMatch(/127\.0\.0\.1/);
    expect(JSON.stringify(payloads)).not.toContain("data=");
  });
  it("should count the website without a council and respect Do Not Track", async () => {
    umami.calls = [];
    expect(
      (
        await request(harness.app.getHttpServer())
          .get("/v2/public/analytics/web")
          .expect(200)
      ).body,
    ).toEqual({ enabled: true });
    await hit({ app: "web", path: "/buscar?q=padel", event: "search" }).expect(
      204,
    );
    await hit({ app: "web", path: "/" }, { DNT: "1" }).expect(204);
    await hit({ app: "web", path: "/" }, { "Sec-GPC": "1" }).expect(204);
    // An app event on the website, or an unknown one, is not counted either.
    await hit({ app: "web", path: "/", event: "booking-confirmed" }).expect(
      204,
    );
    await hit({ app: "web", path: "/", event: "anything" }).expect(400);
    await hit({ app: "app", path: "/app/x" }).expect(400);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(await sent(1)).toEqual([
      expect.objectContaining({ website: WEB, url: "/buscar", name: "search" }),
    ]);
    expect((await sent(1))[0]).not.toHaveProperty("tag");
  });
  it("should show the operator the app, the website and each council with analytics on", async () => {
    umami.calls = [];
    const on = await tenant();
    const off = await tenant();
    await switchOn(on);
    await harness.db.query(
      "INSERT INTO operators (id,display_name) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      ["40000000-0000-4000-8000-000000000001", "Deputación"],
    );
    const operator = request.agent(harness.app.getHttpServer());
    await post(operator, "public/operator-sessions", {}).expect(201);
    const response = await operator
      .get("/v2/operator/web-analytics")
      .query({ from: "2026-10-01", to: "2026-10-31" })
      .expect(200);
    expect(response.body).toMatchObject({
      available: true,
      enabled: true,
      from: "2026-10-01",
      to: "2026-10-31",
      app: {
        visitors: 10,
        visits: 16,
        pageviews: 40,
        bounceRate: 25,
        averageVisitSeconds: 100,
        pages: [{ value: "url-a", count: 7 }],
        events: [{ value: "booking-confirmed", count: 3 }],
      },
      web: { visitors: 10 },
    });
    const slugs = (
      response.body as { municipalities: { slug: string }[] }
    ).municipalities.map((row) => row.slug);
    expect(slugs).toContain(on.slug);
    expect(slugs).not.toContain(off.slug);
    const login = umami.calls.filter((call) => call.path === "/api/auth/login");
    expect(login).toHaveLength(1);
    const stats = umami.calls.find((call) => call.path.endsWith("/stats"))!;
    expect(stats.headers.authorization).toMatch(/^Bearer token-/);
    expect(Number(stats.query.get("startAt"))).toBeLessThan(
      Number(stats.query.get("endAt")),
    );
    // An expired token is renewed once and the dashboard still answers.
    umami.expireToken = true;
    await operator.get("/v2/operator/web-analytics").expect(200);
    expect(
      umami.calls.filter((call) => call.path === "/api/auth/login"),
    ).toHaveLength(2);
    umami.down = true;
    expect(
      (await operator.get("/v2/operator/web-analytics").expect(503)).body.code,
    ).toBe("analytics_unavailable");
    umami.down = false;
    await operator
      .get("/v2/operator/web-analytics")
      .query({ from: "2026-10-31", to: "2026-10-01" })
      .expect(400);
    await on.citizen.get("/v2/operator/web-analytics").expect(401);
  });
  it("should show a manager only their council's app visits, and nothing while it is off", async () => {
    umami.calls = [];
    const context = await tenant();
    const off = (
      await context.manager.get("/v2/manager/web-analytics").expect(200)
    ).body as { enabled: boolean; app: unknown };
    expect(off).toMatchObject({ available: true, enabled: false, app: null });
    expect(umami.calls).toEqual([]);
    await switchOn(context);
    const on = await context.manager
      .get("/v2/manager/web-analytics")
      .expect(200);
    expect(on.body).toMatchObject({
      enabled: true,
      app: { pageviews: 12, visitors: 4, bounceRate: 40 },
      web: null,
      municipalities: [],
    });
    const reads = umami.calls.filter((call) =>
      call.path.startsWith("/api/websites"),
    );
    expect(reads.length).toBeGreaterThan(0);
    expect(reads.every((call) => call.query.get("tag") === context.slug)).toBe(
      true,
    );
    expect(reads.every((call) => call.path.includes(APP))).toBe(true);
    await context.citizen.get("/v2/manager/web-analytics").expect(403);
  });
});
