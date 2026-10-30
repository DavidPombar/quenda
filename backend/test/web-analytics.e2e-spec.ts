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
  setup,
  teardown,
  tenant,
} from "./harness";
beforeAll(setup);
afterAll(teardown);
/** Stands in for the council's Umami and records each collected view. */
async function umami() {
  const received: { headers: IncomingHttpHeaders; body: unknown }[] = [];
  const server: Server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      received.push({
        headers: req.headers,
        body: {
          path: req.url,
          ...JSON.parse(Buffer.concat(chunks).toString()),
        },
      });
      res.writeHead(200, { "Content-Type": "application/json" }).end("{}");
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    received,
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
function view(context: Tenant, path: string) {
  return request(harness.app.getHttpServer())
    .post("/v2/public/analytics/pageview")
    .set("X-Quenda-Request", "1")
    .set("User-Agent", "Mozilla/5.0 (test browser)")
    .send({ slug: context.slug, path, language: "gl", screen: "390x844" });
}
async function settle(check: () => boolean) {
  for (let i = 0; i < 50 && !check(); i++)
    await new Promise((resolve) => setTimeout(resolve, 20));
}
describe("Web analytics through the council's own Umami", () => {
  it("should pass views to Umami only when the council turned it on, without query strings or ids", async () => {
    const server = await umami();
    try {
      const context = await tenant();
      await view(context, "/app/x/instalacions").expect(204);
      const website = randomUUID();
      const saved = await patch(context.manager, "manager/municipality", {
        analyticsUrl: `${server.url}/`,
        analyticsWebsiteId: website,
      }).expect(200);
      expect(saved.body.settings).toMatchObject({
        analytics: true,
        analyticsUrl: server.url,
        analyticsWebsiteId: website,
      });
      const listed = await context.citizen
        .get("/v2/public/municipalities")
        .expect(200);
      const publicView = (
        listed.body as { slug: string; analyticsUrl?: string }[]
      ).find((item) => item.slug === context.slug);
      expect(publicView).toMatchObject({ analytics: true });
      expect(publicView).not.toHaveProperty("analyticsUrl");
      await view(
        context,
        `/app/${context.slug}/instalacions/${randomUUID()}?data=2026-11-02`,
      ).expect(204);
      await view(context, `/app/${context.slug}/baixa?token=secret`).expect(
        204,
      );
      await settle(() => server.received.length === 2);
      expect(server.received.map((call) => call.body)).toEqual([
        {
          path: "/api/send",
          type: "event",
          payload: expect.objectContaining({
            website,
            url: `/app/${context.slug}/instalacions/:id`,
            language: "gl",
            screen: "390x844",
            referrer: "",
          }) as unknown,
        },
        expect.objectContaining({
          payload: expect.objectContaining({
            url: `/app/${context.slug}/baixa`,
          }) as unknown,
        }),
      ]);
      expect(JSON.stringify(server.received)).not.toContain("secret");
      expect(server.received[0].headers["user-agent"]).toBe(
        "Mozilla/5.0 (test browser)",
      );
      expect(server.received[0].headers["x-forwarded-for"]).toMatch(
        /127\.0\.0\.1/,
      );
      // Switching it off stops the views.
      await patch(context.manager, "manager/municipality", {
        analyticsUrl: "",
        analyticsWebsiteId: null,
      }).expect(200);
      await view(context, `/app/${context.slug}/reservas`).expect(204);
      await settle(() => false);
      expect(server.received).toHaveLength(2);
    } finally {
      await server.close();
    }
  });
  it("should refuse a plain HTTP or half-configured Umami and keep it to the council's managers", async () => {
    const context = await tenant();
    for (const body of [
      {
        analyticsUrl: "http://umami.example.org",
        analyticsWebsiteId: randomUUID(),
      },
      { analyticsUrl: "https://umami.example.org" },
      { analyticsWebsiteId: randomUUID() },
    ])
      expect(
        (await patch(context.manager, "manager/municipality", body).expect(422))
          .body.code,
      ).toBe("invalid_analytics");
    await patch(context.manager, "manager/municipality", {
      analyticsUrl: "https://umami.example.org",
      analyticsWebsiteId: "not-a-uuid",
    }).expect(400);
    await patch(context.citizen, "manager/municipality", {
      analyticsUrl: "https://umami.example.org",
      analyticsWebsiteId: randomUUID(),
    }).expect(403);
  });
});
