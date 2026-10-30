// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Type } from "@nestjs/common";
import request from "supertest";
import {
  LEGAL_VERSION,
  type Tenant,
  harness,
  setupWith,
  teardown,
  tenant,
} from "./harness";
import { FakeSmtp } from "./fake-smtp";
const smtp = new FakeSmtp();
beforeAll(async () => {
  await smtp.start();
  await setupWith({
    env: () => ({ SMTP_URL: smtp.url, EMAIL_LOGIN: undefined }),
  });
});
afterAll(async () => {
  await teardown();
  await smtp.stop();
});
const api = () => request.agent(harness.app.getHttpServer());
function requestCode(
  context: Pick<Tenant, "slug">,
  email: string,
  legalVersion: string | undefined = LEGAL_VERSION,
) {
  return api()
    .post("/v2/public/auth/email/codes")
    .set("X-Quenda-Request", "1")
    .send({ slug: context.slug, email, legalVersion });
}
function verify(
  agent: ReturnType<typeof api>,
  context: Pick<Tenant, "slug">,
  email: string,
  code: string,
) {
  return agent
    .post("/v2/public/auth/email/sessions")
    .set("X-Quenda-Request", "1")
    .send({ slug: context.slug, email, code });
}
/** The code from the last mail sent to the address. */
function mailedCode(email: string) {
  const mail = smtp.mails.filter((value) => value.to === email).at(-1);
  return /\b([0-9]{6})\b/.exec(mail?.data ?? "")?.[1] ?? "";
}
function worker() {
  const { DeliveryWorker } =
    require("../dist/v2/modules/notifications/infrastructure/worker/delivery-worker.js") as {
      DeliveryWorker: Type<{ runOnce(): Promise<unknown> }>;
    };
  return harness.app.get(DeliveryWorker);
}
describe("Sign-in with an email code (#8, part B)", () => {
  it("should mail a code, open a citizen account with it and reuse the account next time", async () => {
    const context = await tenant();
    const methods = await api().get("/v2/public/auth/methods").expect(200);
    expect(methods.body.email).toBe(true);
    await requestCode(context, " Ana@Example.org ").expect(202);
    const code = mailedCode("ana@example.org");
    expect(code).toMatch(/^[0-9]{6}$/);
    // Once sent, the row keeps neither the address nor the code.
    const stored = await harness.db.query(
      "SELECT recipient, pending_code, sent_at FROM login_codes WHERE tenant_id=$1",
      [context.id],
    );
    expect(stored.rows[0]).toMatchObject({
      recipient: null,
      pending_code: null,
    });
    expect(stored.rows[0].sent_at).not.toBeNull();
    const agent = api();
    const session = await verify(
      agent,
      context,
      "ana@example.org",
      code,
    ).expect(201);
    expect(session.body).toMatchObject({
      role: "citizen",
      displayName: "ana",
      assurance: "email",
    });
    await agent.get("/v2/citizen/me").expect(200);
    // The code works once.
    await verify(api(), context, "ana@example.org", code).expect(400);
    await requestCode(context, "ana@example.org").expect(202);
    const again = await verify(
      api(),
      context,
      "ana@example.org",
      mailedCode("ana@example.org"),
    ).expect(201);
    expect(again.body.userId).toBe(session.body.userId);
    const audit = await harness.db.query(
      "SELECT details FROM audit_events WHERE tenant_id=$1 AND action='auth.signed_in'",
      [context.id],
    );
    expect(audit.rows.map((row) => row.details)).toEqual([
      { method: "email" },
      { method: "email" },
    ]);
    const consents = await harness.db.query(
      "SELECT count(*)::int AS count FROM consents WHERE tenant_id=$1 AND user_id=$2",
      [context.id, session.body.userId],
    );
    expect(consents.rows[0].count).toBe(2);
  });
  it("should never reveal whether an account exists and should need the current notice", async () => {
    const context = await tenant();
    await requestCode(context, "nobody@example.org").expect(202);
    await requestCode(context, "not-an-address").expect(400);
    await requestCode(context, "ana@example.org", "old").expect(422);
    await requestCode({ slug: "missing" }, "ana@example.org").expect(404);
  });
  it("should keep an email account apart from a Cl@ve account with the same address", async () => {
    const context = await tenant();
    await harness.db.query(
      "UPDATE users SET email='eva@example.org', assurance='eid' WHERE id=$1",
      [context.users.citizen],
    );
    await requestCode(context, "eva@example.org").expect(202);
    const session = await verify(
      api(),
      context,
      "eva@example.org",
      mailedCode("eva@example.org"),
    ).expect(201);
    expect(session.body.userId).not.toBe(context.users.citizen);
    expect(session.body.assurance).toBe("email");
  });
  it("should invalidate a code after five wrong attempts and refuse an expired one", async () => {
    const context = await tenant();
    await requestCode(context, "leo@example.org").expect(202);
    const code = mailedCode("leo@example.org");
    const wrong = code === "000000" ? "111111" : "000000";
    for (let attempt = 1; attempt < 5; attempt++)
      expect(
        (await verify(api(), context, "leo@example.org", wrong).expect(400))
          .body.code,
      ).toBe("code_invalid");
    expect(
      (await verify(api(), context, "leo@example.org", wrong).expect(400)).body
        .code,
    ).toBe("code_expired");
    await verify(api(), context, "leo@example.org", code).expect(400);
    await requestCode(context, "leo@example.org").expect(202);
    await harness.db.query(
      "UPDATE login_codes SET expires_at=now() - interval '1 minute' WHERE tenant_id=$1",
      [context.id],
    );
    expect(
      (
        await verify(
          api(),
          context,
          "leo@example.org",
          mailedCode("leo@example.org"),
        ).expect(400)
      ).body.code,
    ).toBe("code_expired");
    await verify(api(), context, "leo@example.org", "12ab").expect(400);
  });
  it("should stop mailing an address after five codes an hour, without saying so", async () => {
    const context = await tenant();
    const before = smtp.mails.length;
    for (let index = 0; index < 7; index++)
      await requestCode(context, "max@example.org").expect(202);
    expect(smtp.mails.length - before).toBe(5);
  });
  it("should keep each municipality's codes apart", async () => {
    const first = await tenant();
    const second = await tenant();
    await requestCode(first, "sol@example.org").expect(202);
    await verify(
      api(),
      second,
      "sol@example.org",
      mailedCode("sol@example.org"),
    ).expect(400);
  });
  it("should retry a code the mail server refused, from the delivery worker", async () => {
    const context = await tenant();
    smtp.failing = true;
    await requestCode(context, "rio@example.org").expect(202);
    const pending = await harness.db.query(
      "SELECT pending_code, last_error FROM login_codes WHERE tenant_id=$1",
      [context.id],
    );
    expect(pending.rows[0].pending_code).toMatch(/^[0-9]{6}$/);
    expect(pending.rows[0].last_error).toBeTruthy();
    smtp.failing = false;
    await worker().runOnce();
    const code = mailedCode("rio@example.org");
    expect(code).toBe(pending.rows[0].pending_code);
    await verify(api(), context, "rio@example.org", code).expect(201);
  });
  it("should remove the person's codes when they delete their account", async () => {
    const context = await tenant();
    await requestCode(context, "uxe@example.org").expect(202);
    const agent = api();
    await verify(
      agent,
      context,
      "uxe@example.org",
      mailedCode("uxe@example.org"),
    ).expect(201);
    await requestCode(context, "uxe@example.org").expect(202);
    await agent
      .delete("/v2/citizen/me")
      .set("X-Quenda-Request", "1")
      .send({ confirm: true })
      .expect(204);
    const left = await harness.db.query(
      "SELECT count(*)::int AS count FROM login_codes WHERE tenant_id=$1",
      [context.id],
    );
    expect(left.rows[0].count).toBe(0);
  });
});
