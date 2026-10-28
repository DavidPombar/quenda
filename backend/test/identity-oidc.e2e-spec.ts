// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import request from "supertest";
import {
  LEGAL_VERSION,
  del,
  harness,
  setupWith,
  teardown,
  tenant,
  type Agent,
} from "./harness";
import { FakeOidc } from "./fake-oidc";
const idp = new FakeOidc();
let publicUrl = "";
beforeAll(async () => {
  await idp.start();
  await setupWith({
    env: (baseUrl) => {
      publicUrl = baseUrl;
      idp.redirectUri = `${baseUrl}/v2/public/auth/oidc/callback`;
      return {
        PUBLIC_URL: baseUrl,
        OIDC_ISSUER: idp.issuer,
        OIDC_DISCOVERY_URL: undefined,
        OIDC_CLIENT_ID: idp.clientId,
        OIDC_CLIENT_SECRET: idp.clientSecret,
        OIDC_LABEL: "Cl@ve",
        OIDC_IDP_HINT: "clave",
        QUENDA_DATA_KEY: randomBytes(32).toString("base64"),
      };
    },
  });
});
afterAll(async () => {
  await teardown();
  await idp.stop();
});
function browser() {
  return request.agent(harness.app.getHttpServer());
}
function person(overrides: Record<string, unknown> = {}) {
  return {
    sub: `person-${randomUUID()}`,
    given_name: "Iria",
    family_name: "Castro Souto",
    email: "iria@example.invalid",
    nif: "12345678Z",
    ...overrides,
  };
}
function start(agent: Agent, query: Record<string, string>) {
  return agent.get("/v2/public/auth/oidc/start").query(query).redirects(0);
}
/** Follows start → identity provider → callback by hand, as a browser would. */
async function signIn(
  agent: Agent,
  slug: string,
  query: Record<string, string> = { legalVersion: LEGAL_VERSION },
  tamper?: (callback: URL) => Promise<void> | void,
) {
  const started = await start(agent, { slug, ...query });
  expect(started.status).toBe(302);
  const fromIdp = await fetch(started.headers.location, { redirect: "manual" });
  expect(fromIdp.status).toBe(302);
  const callback = new URL(fromIdp.headers.get("location")!);
  expect(callback.origin + callback.pathname).toBe(idp.redirectUri);
  await tamper?.(callback);
  const finished = await agent
    .get(callback.pathname + callback.search)
    .redirects(0);
  expect(finished.status).toBe(303);
  return { started, finished, location: finished.headers.location as string };
}
function home(slug: string) {
  return `${publicUrl}/app/${slug}/instalacions`;
}
async function userBySubject(tenantId: string, subject: string) {
  return (
    await harness.db.query(
      "SELECT u.* FROM identities i JOIN users u ON u.id=i.user_id AND u.tenant_id=i.tenant_id WHERE i.tenant_id=$1 AND i.subject=$2",
      [tenantId, subject],
    )
  ).rows[0];
}
describe("Electronic identification (T3, T4) through a generic OIDC provider", () => {
  it("should list the configured sign-in methods", async () => {
    const methods = await request(harness.app.getHttpServer())
      .get("/v2/public/auth/methods")
      .expect(200);
    expect(methods.body).toEqual({
      demo: true,
      oidc: { label: "Cl@ve" },
      email: false,
    });
  });
  it("should create an eID citizen with a working session when a person signs in for the first time", async () => {
    const context = await tenant();
    idp.claims = person();
    const agent = browser();
    const { started, location } = await signIn(agent, context.slug);
    const cookie = String(started.headers["set-cookie"]);
    expect(cookie).toMatch(/quenda_login=[\w-]{43};/);
    expect(cookie).toMatch(/Path=\/v2\/public\/auth/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Max-Age=600/);
    const authorize = idp.lastAuthorize!;
    expect(authorize.get("kc_idp_hint")).toBe("clave");
    expect(authorize.get("code_challenge_method")).toBe("S256");
    expect(location).toBe(home(context.slug));
    const session = await agent.get("/v2/public/session").expect(200);
    expect(session.body.session).toMatchObject({
      tenantId: context.id,
      displayName: "Iria Castro Souto",
      role: "citizen",
      assurance: "eid",
    });
    const me = await agent.get("/v2/citizen/me").expect(200);
    expect(me.body.consentUpToDate).toBe(true);
    await agent.get("/v2/citizen/bookings").expect(200);
    const user = await userBySubject(context.id, idp.claims.sub as string);
    expect(user).toMatchObject({
      assurance: "eid",
      email: "iria@example.invalid",
      nif_ciphertext: null,
      nif_digest: null,
    });
    const audit = await harness.db.query(
      "SELECT action, details FROM audit_events WHERE tenant_id=$1 AND actor_id=$2 ORDER BY action",
      [context.id, user.id],
    );
    expect(audit.rows).toEqual([
      { action: "auth.signed_in", details: { method: "oidc" } },
      { action: "consent.accepted", details: { legalVersion: LEGAL_VERSION } },
    ]);
    // The attempt is consumed, so the same state cannot be used twice.
    expect(
      (
        await harness.db.query(
          "SELECT count(*)::int AS count FROM login_attempts WHERE tenant_id=$1",
          [context.id],
        )
      ).rows[0].count,
    ).toBe(0);
  });
  it("should reuse the linked account when the same person signs in again", async () => {
    const context = await tenant();
    idp.claims = person();
    await signIn(browser(), context.slug);
    const first = await userBySubject(context.id, idp.claims.sub as string);
    idp.claims = { ...idp.claims, given_name: "Iria María" };
    const agent = browser();
    await signIn(agent, context.slug);
    const session = await agent.get("/v2/public/session").expect(200);
    expect(session.body.session.userId).toBe(first.id);
    expect(session.body.session.displayName).toBe("Iria María Castro Souto");
    const counts = await harness.db.query(
      "SELECT (SELECT count(*) FROM identities WHERE tenant_id=$1)::int AS identities, (SELECT count(*) FROM consents WHERE tenant_id=$1 AND user_id=$2)::int AS consents",
      [context.id, first.id],
    );
    expect(counts.rows[0]).toEqual({ identities: 1, consents: 2 });
  });
  it("should keep the eID account out of the demo sign-in", async () => {
    const context = await tenant();
    idp.claims = person();
    await signIn(browser(), context.slug);
    const demo = await browser()
      .post("/v2/public/sessions")
      .set("X-Quenda-Request", "1")
      .send({
        slug: context.slug,
        role: "citizen",
        legalVersion: LEGAL_VERSION,
      })
      .expect(201);
    expect(demo.body).toMatchObject({
      userId: context.users.citizen,
      assurance: "demo",
    });
  });
  it("should reject the sign-in when the returned state does not match the browser cookie", async () => {
    const context = await tenant();
    idp.claims = person();
    const { location } = await signIn(
      browser(),
      context.slug,
      undefined,
      (callback) => {
        callback.searchParams.set("state", "x".repeat(43));
      },
    );
    expect(location).toBe(`${publicUrl}/app/?authError=login_rejected`);
    expect(await userBySubject(context.id, idp.claims.sub as string)).toBe(
      undefined,
    );
  });
  it("should reject a callback from a browser that did not start the sign-in", async () => {
    const context = await tenant();
    idp.claims = person();
    const started = await start(browser(), {
      slug: context.slug,
      legalVersion: LEGAL_VERSION,
    });
    const fromIdp = await fetch(started.headers.location, {
      redirect: "manual",
    });
    const callback = new URL(fromIdp.headers.get("location")!);
    const response = await browser()
      .get(callback.pathname + callback.search)
      .redirects(0)
      .expect(303);
    expect(response.headers.location).toContain("authError=login_rejected");
  });
  it("should report an expired sign-in when the attempt is older than ten minutes", async () => {
    const context = await tenant();
    idp.claims = person();
    const { location } = await signIn(
      browser(),
      context.slug,
      undefined,
      async (callback) => {
        // Only a hash of the state is stored.
        const stored = await harness.db.query(
          "SELECT state_hash FROM login_attempts WHERE tenant_id=$1",
          [context.id],
        );
        expect(stored.rows).toHaveLength(1);
        expect(stored.rows[0].state_hash).not.toBe(
          callback.searchParams.get("state"),
        );
        await harness.db.query(
          "UPDATE login_attempts SET expires_at=now() - interval '1 minute' WHERE tenant_id=$1",
          [context.id],
        );
      },
    );
    expect(location).toBe(`${publicUrl}/app/?authError=login_expired`);
    expect(await userBySubject(context.id, idp.claims.sub as string)).toBe(
      undefined,
    );
  });
  it("should reject an ID token whose nonce does not match the attempt", async () => {
    const context = await tenant();
    idp.claims = person();
    idp.mode = "wrong_nonce";
    try {
      const agent = browser();
      const { location } = await signIn(agent, context.slug);
      expect(location).toBe(`${home(context.slug)}?authError=login_rejected`);
      expect(
        (await agent.get("/v2/public/session").expect(200)).body.session,
      ).toBeNull();
    } finally {
      idp.mode = "ok";
    }
  });
  it("should reject the sign-in when the person cancels at the identity provider", async () => {
    const context = await tenant();
    idp.mode = "access_denied";
    try {
      const { location } = await signIn(browser(), context.slug);
      expect(location).toBe(`${home(context.slug)}?authError=login_rejected`);
    } finally {
      idp.mode = "ok";
    }
  });
  it("should ask for the privacy notice before contacting the identity provider", async () => {
    const context = await tenant();
    const before = idp.authorizeCount;
    for (const query of [
      { slug: context.slug },
      { slug: context.slug, legalVersion: "2000-01" },
    ]) {
      const response = await start(browser(), query).expect(303);
      expect(response.headers.location).toBe(
        `${home(context.slug)}?authError=consent_required`,
      );
      expect(response.headers["set-cookie"]).toBeUndefined();
    }
    expect(idp.authorizeCount).toBe(before);
    expect(
      (
        await harness.db.query(
          "SELECT count(*)::int AS count FROM login_attempts WHERE tenant_id=$1",
          [context.id],
        )
      ).rows[0].count,
    ).toBe(0);
    const unknown = await start(browser(), {
      slug: "no-such-town",
      legalVersion: LEGAL_VERSION,
    }).expect(303);
    expect(unknown.headers.location).toBe(
      `${publicUrl}/app/?authError=not_found`,
    );
  });
  it("should return only to paths inside the citizen app", async () => {
    const context = await tenant();
    idp.claims = person();
    const external = await signIn(browser(), context.slug, {
      legalVersion: LEGAL_VERSION,
      returnTo: "https://evil.example/app/",
    });
    expect(external.location).toBe(home(context.slug));
    const internal = await signIn(browser(), context.slug, {
      legalVersion: LEGAL_VERSION,
      returnTo: `/app/${context.slug}/reservas`,
    });
    expect(internal.location).toBe(`${publicUrl}/app/${context.slug}/reservas`);
  });
  it("should store the NIF only encrypted and only where the municipality verifies residency", async () => {
    const context = await tenant();
    await harness.db.query(
      "UPDATE municipalities SET store_nif=true WHERE id=$1",
      [context.id],
    );
    idp.claims = person({ nif: "es/es/12.345.678-z" });
    await signIn(browser(), context.slug);
    const user = await userBySubject(context.id, idp.claims.sub as string);
    expect(user.nif_ciphertext).toMatch(/^v1\./);
    expect(user.nif_digest).toEqual(expect.any(String));
    expect(JSON.stringify(user)).not.toMatch(/12345678|12\.345/i);
    // Disabling the option clears the NIF on the next sign-in.
    await harness.db.query(
      "UPDATE municipalities SET store_nif=false WHERE id=$1",
      [context.id],
    );
    await signIn(browser(), context.slug);
    expect(
      await userBySubject(context.id, idp.claims.sub as string),
    ).toMatchObject({ nif_ciphertext: null, nif_digest: null });
  });
  it("should keep separate, isolated accounts when the same person signs in to two municipalities", async () => {
    const first = await tenant();
    const second = await tenant();
    idp.claims = person();
    const one = browser();
    const two = browser();
    await signIn(one, first.slug);
    await signIn(two, second.slug);
    const a = (await one.get("/v2/public/session").expect(200)).body.session;
    const b = (await two.get("/v2/public/session").expect(200)).body.session;
    expect(a.tenantId).toBe(first.id);
    expect(b.tenantId).toBe(second.id);
    expect(a.userId).not.toBe(b.userId);
    expect((await one.get("/v2/citizen/me").expect(200)).body.userId).toBe(
      a.userId,
    );
  });
  it("should export the identity and the NIF, and remove them when the account is deleted", async () => {
    const context = await tenant();
    await harness.db.query(
      "UPDATE municipalities SET store_nif=true WHERE id=$1",
      [context.id],
    );
    idp.claims = person();
    const agent = browser();
    await signIn(agent, context.slug);
    const exported = await agent.get("/v2/citizen/me/export").expect(200);
    expect(exported.body.profile).toMatchObject({
      email: "iria@example.invalid",
      assurance: "eid",
      nif: "12345678Z",
    });
    expect(exported.body.identities).toEqual([
      {
        issuer: idp.issuer,
        subject: idp.claims.sub,
        createdAt: expect.any(String),
      },
    ]);
    const userId = exported.body.profile.userId;
    await del(agent, "citizen/me").expect(204);
    const user = await harness.db.query(
      "SELECT email, nif_ciphertext, nif_digest, deleted_at FROM users WHERE id=$1",
      [userId],
    );
    expect(user.rows[0]).toMatchObject({
      email: null,
      nif_ciphertext: null,
      nif_digest: null,
    });
    expect(user.rows[0].deleted_at).not.toBeNull();
    expect(
      (
        await harness.db.query(
          "SELECT count(*)::int AS count FROM identities WHERE tenant_id=$1 AND user_id=$2",
          [context.id, userId],
        )
      ).rows[0].count,
    ).toBe(0);
    // Signing in again creates a new, unrelated account.
    const again = browser();
    await signIn(again, context.slug);
    expect(
      (await again.get("/v2/public/session").expect(200)).body.session.userId,
    ).not.toBe(userId);
  });
});
