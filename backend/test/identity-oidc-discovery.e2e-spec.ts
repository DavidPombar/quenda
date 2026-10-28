// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { LEGAL_VERSION, harness, setupWith, teardown, tenant } from "./harness";
import { FakeOidc } from "./fake-oidc";
// As in Compose: the browser-facing issuer is not reachable from the API, which discovers through
// a back-channel URL. ID tokens must still carry the configured issuer.
const issuer = "http://127.0.0.1:8081/realms/quenda";
const idp = new FakeOidc();
beforeAll(async () => {
  await idp.start({ issuer });
  await setupWith({
    env: (baseUrl) => {
      idp.redirectUri = `${baseUrl}/v2/public/auth/oidc/callback`;
      return {
        PUBLIC_URL: baseUrl,
        OIDC_ISSUER: issuer,
        OIDC_DISCOVERY_URL: idp.url,
        OIDC_CLIENT_ID: idp.clientId,
        OIDC_CLIENT_SECRET: idp.clientSecret,
        OIDC_LABEL: undefined,
        OIDC_IDP_HINT: undefined,
        QUENDA_DATA_KEY: undefined,
      };
    },
  });
});
afterAll(async () => {
  await teardown();
  await idp.stop();
});
describe("OIDC discovery through a back-channel URL", () => {
  it("should sign in when discovery is fetched from a URL other than the issuer", async () => {
    const context = await tenant();
    idp.claims = { sub: `person-${randomUUID()}`, name: "Brais Lema" };
    const agent = request.agent(harness.app.getHttpServer());
    const started = await agent
      .get("/v2/public/auth/oidc/start")
      .query({ slug: context.slug, legalVersion: LEGAL_VERSION })
      .redirects(0)
      .expect(302);
    expect(idp.lastAuthorize).toBeNull();
    const fromIdp = await fetch(started.headers.location, {
      redirect: "manual",
    });
    expect(idp.lastAuthorize?.has("kc_idp_hint")).toBe(false);
    const callback = new URL(fromIdp.headers.get("location")!);
    // Keycloak adds RFC 9207 `iss` and `session_state`; both are accepted.
    callback.searchParams.set("iss", issuer);
    callback.searchParams.set("session_state", randomUUID());
    await agent
      .get(callback.pathname + callback.search)
      .redirects(0)
      .expect(303);
    const session = await agent.get("/v2/public/session").expect(200);
    expect(session.body.session).toMatchObject({
      displayName: "Brais Lema",
      assurance: "eid",
    });
    const methods = await request(harness.app.getHttpServer())
      .get("/v2/public/auth/methods")
      .expect(200);
    expect(methods.body.oidc).toEqual({ label: "OpenID Connect" });
  });
  it("should reject a callback whose iss parameter names another issuer", async () => {
    const context = await tenant();
    idp.claims = { sub: `person-${randomUUID()}` };
    const agent = request.agent(harness.app.getHttpServer());
    const started = await agent
      .get("/v2/public/auth/oidc/start")
      .query({ slug: context.slug, legalVersion: LEGAL_VERSION })
      .redirects(0)
      .expect(302);
    const fromIdp = await fetch(started.headers.location, {
      redirect: "manual",
    });
    const callback = new URL(fromIdp.headers.get("location")!);
    callback.searchParams.set("iss", "https://evil.example");
    const response = await agent
      .get(callback.pathname + callback.search)
      .redirects(0)
      .expect(303);
    expect(response.headers.location).toContain("authError=login_rejected");
  });
});
