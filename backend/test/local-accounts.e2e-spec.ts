// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import request from "supertest";
import type { INestApplicationContext } from "@nestjs/common";
import {
  type Tenant,
  harness,
  patch,
  post,
  setupWith,
  teardown,
  tenant,
} from "./harness";
import {
  codeAt,
  fromBase32,
  stepAt,
} from "../src/v2/modules/identity/domain/totp";
beforeAll(() =>
  setupWith({
    env: () => ({ QUENDA_DATA_KEY: randomBytes(32).toString("base64") }),
  }),
);
afterAll(teardown);
const agent = () => request.agent(harness.app.getHttpServer());
type Agent = ReturnType<typeof agent>;
const now = () => Math.floor(Date.now() / 1000);
/** A code for the secret, one step ahead so it never repeats an earlier accepted step. */
function totp(secret: string, offset = 0) {
  return codeAt(fromBase32(secret), stepAt(now()) + offset);
}
async function operatorSession() {
  // The synthetic operator the demo sign-in hands out.
  await harness.db.query(
    "INSERT INTO operators (id,display_name) VALUES ('40000000-0000-4000-8000-000000000001','Deputación · demo') ON CONFLICT DO NOTHING",
  );
  const operator = agent();
  await post(operator, "public/operator-sessions", {}).expect(201);
  return operator;
}
async function createManager(context: Tenant, login: string) {
  const operator = await operatorSession();
  const id = randomUUID();
  const created = await post(
    operator,
    `operator/municipalities/${context.id}/managers`,
    {
      id,
      displayName: "Antía Souto",
      email: `${login}@example.invalid`,
      login,
    },
  ).expect(201);
  return {
    id,
    operator,
    temporaryPassword: created.body.temporaryPassword as string,
    body: created.body,
  };
}
function password(
  browser: Agent,
  context: Pick<Tenant, "slug">,
  login: string,
  secret: string,
) {
  return post(browser, "public/auth/staff/password", {
    slug: context.slug,
    login,
    password: secret,
  });
}
/** Runs the first sign-in: temporary password, new password, second factor. */
async function firstSignIn(
  browser: Agent,
  context: Pick<Tenant, "slug">,
  login: string,
  temporaryPassword: string,
  newPassword = "a long new password",
) {
  const first = await password(
    browser,
    context,
    login,
    temporaryPassword,
  ).expect(200);
  expect(first.body).toEqual({
    ticket: expect.any(String),
    step: "password_change",
  });
  const changed = await post(browser, "public/auth/local/password-change", {
    ticket: first.body.ticket,
    newPassword,
  }).expect(200);
  expect(changed.body.step).toBe("enroll");
  const { secret, otpauthUri } = changed.body.enrollment as {
    secret: string;
    otpauthUri: string;
  };
  expect(otpauthUri).toMatch(/^otpauth:\/\/totp\/Quenda/);
  const code = totp(secret);
  const session = await post(browser, "public/auth/local/totp", {
    ticket: changed.body.ticket,
    code,
  }).expect(200);
  return { secret, code, session: session.body };
}
describe("Local staff accounts with password and second factor (#8, part C)", () => {
  it("should take a new manager from the temporary password to a session in their municipality", async () => {
    const context = await tenant();
    const other = await tenant();
    const manager = await createManager(context, "Antia.Souto");
    expect(manager.body).toMatchObject({
      login: "antia.souto",
      temporaryPassword: expect.stringMatching(/^[\w-]{16}$/),
    });
    // A retry of the same request never shows the password again.
    await post(
      manager.operator,
      `operator/municipalities/${context.id}/managers`,
      {
        id: manager.id,
        displayName: "Antía Souto",
        email: "antia.souto@example.invalid",
        login: "antia.souto",
      },
    )
      .expect(201)
      .expect(({ body }) => expect(body.temporaryPassword).toBeNull());
    const browser = agent();
    // The temporary password is too weak to keep: it must be replaced first.
    const first = await password(
      browser,
      context,
      "antia.souto",
      manager.temporaryPassword,
    ).expect(200);
    await post(browser, "public/auth/local/password-change", {
      ticket: first.body.ticket,
      newPassword: "short",
    }).expect(400);
    await post(browser, "public/auth/local/password-change", {
      ticket: first.body.ticket,
      newPassword: "antia.souto",
    }).expect(400);
    const changed = await post(browser, "public/auth/local/password-change", {
      ticket: first.body.ticket,
      newPassword: "a long new password",
    }).expect(200);
    const session = await post(browser, "public/auth/local/totp", {
      ticket: changed.body.ticket,
      code: totp(changed.body.enrollment.secret),
    }).expect(200);
    expect(session.body).toMatchObject({
      userId: manager.id,
      tenantId: context.id,
      role: "manager",
      assurance: "local",
    });
    // The session belongs to this municipality only.
    const staff = await browser.get("/v2/manager/staff").expect(200);
    expect(staff.body.map((item: { userId: string }) => item.userId)).toContain(
      manager.id,
    );
    // Next time: password and code only.
    const again = agent();
    const step = await password(
      again,
      context,
      "antia.souto",
      "a long new password",
    ).expect(200);
    expect(step.body.step).toBe("totp");
    await post(again, "public/auth/local/totp", {
      ticket: step.body.ticket,
      code: totp(changed.body.enrollment.secret, 1),
    }).expect(200);
    // The same login in another municipality is someone else.
    await password(agent(), other, "antia.souto", "a long new password").expect(
      401,
    );
  });
  it("should answer a wrong password and an unknown login alike, and lock after five failures", async () => {
    const context = await tenant();
    const manager = await createManager(context, "brais");
    const unknown = await password(
      agent(),
      context,
      "nobody",
      "whatever password",
    ).expect(401);
    const wrong = await password(
      agent(),
      context,
      "brais",
      "whatever password",
    ).expect(401);
    expect(unknown.body.code).toBe("login_rejected");
    expect(wrong.body).toEqual(unknown.body);
    for (let attempt = 2; attempt < 5; attempt++)
      await password(agent(), context, "brais", "whatever password").expect(
        401,
      );
    expect(
      (
        await password(agent(), context, "brais", "whatever password").expect(
          423,
        )
      ).body.code,
    ).toBe("account_locked");
    // Locked even with the right password.
    await password(agent(), context, "brais", manager.temporaryPassword).expect(
      423,
    );
    const audit = await harness.db.query<{ action: string }>(
      "SELECT action FROM audit_events WHERE tenant_id=$1 AND action LIKE 'auth.%' ORDER BY occurred_at",
      [context.id],
    );
    expect(audit.rows.map((row) => row.action)).toEqual([
      "auth.failed",
      "auth.failed",
      "auth.failed",
      "auth.failed",
      "auth.locked",
    ]);
    // The operator's reset unlocks it with a new temporary password.
    const reset = await post(
      manager.operator,
      `operator/municipalities/${context.id}/managers/${manager.id}/reset`,
      {},
    ).expect(200);
    await firstSignIn(agent(), context, "brais", reset.body.temporaryPassword);
  });
  it("should refuse a code used before and keep the step open after a wrong one", async () => {
    const context = await tenant();
    const manager = await createManager(context, "carme");
    const { secret, code } = await firstSignIn(
      agent(),
      context,
      "carme",
      manager.temporaryPassword,
    );
    const browser = agent();
    const step = await password(
      browser,
      context,
      "carme",
      "a long new password",
    ).expect(200);
    // The code that opened the first session cannot open another one.
    await post(browser, "public/auth/local/totp", {
      ticket: step.body.ticket,
      code,
    }).expect(400);
    await post(browser, "public/auth/local/totp", {
      ticket: step.body.ticket,
      code: totp(secret, 1),
    }).expect(200);
    await post(browser, "public/auth/local/totp", {
      ticket: step.body.ticket,
      code: totp(secret, 1),
    }).expect(401);
  });
  it("should let a manager open, reset and disable door staff accounts", async () => {
    const context = await tenant();
    const manager = await createManager(context, "xestion");
    const browser = agent();
    await firstSignIn(browser, context, "xestion", manager.temporaryPassword);
    const id = randomUUID();
    const created = await post(browser, "manager/staff", {
      id,
      displayName: "Brais Porta",
      login: "brais.porta",
    }).expect(201);
    expect(created.body).toEqual({
      login: "brais.porta",
      temporaryPassword: expect.any(String),
    });
    await post(browser, "manager/staff", {
      id: randomUUID(),
      displayName: "Outra",
      login: "brais.porta",
    }).expect(409);
    const door = agent();
    const signed = await firstSignIn(
      door,
      context,
      "brais.porta",
      created.body.temporaryPassword,
    );
    expect(signed.session).toMatchObject({
      role: "access",
      assurance: "local",
    });
    await door.get("/v2/access/day").expect(200);
    const staff = await browser.get("/v2/manager/staff").expect(200);
    expect(staff.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: id,
          role: "access",
          login: "brais.porta",
          enrolled: true,
          disabled: false,
        }),
      ]),
    );
    // Disabling ends the session at once.
    await patch(browser, `manager/staff/${id}`, { action: "disable" }).expect(
      200,
    );
    await door.get("/v2/access/day").expect(401);
    await password(
      agent(),
      context,
      "brais.porta",
      "a long new password",
    ).expect(401);
    await patch(browser, `manager/staff/${id}`, { action: "enable" }).expect(
      200,
    );
    const reset = await patch(browser, `manager/staff/${id}`, {
      action: "reset",
    }).expect(200);
    await firstSignIn(
      agent(),
      context,
      "brais.porta",
      reset.body.temporaryPassword,
    );
    // A manager cannot touch another manager, nor door staff of another municipality.
    await patch(browser, `manager/staff/${manager.id}`, {
      action: "disable",
    }).expect(404);
    const other = await tenant();
    await patch(other.manager, `manager/staff/${id}`, {
      action: "reset",
    }).expect(404);
    await post(context.citizen, "manager/staff", {
      id: randomUUID(),
      displayName: "Pirata",
      login: "pirata",
    }).expect(403);
  });
  it("should give operators their own local accounts and keep them out of the demo", async () => {
    const { ProvisionLocalAccount } =
      require("../dist/v2/modules/identity/application/commands/provision-local-account.command.js") as {
        ProvisionLocalAccount: new () => unknown;
      };
    const { Commands } =
      require("../dist/v2/shared/infrastructure/commands.locator.js") as {
        Commands: new () => {
          get(type: unknown): {
            execute(args: unknown): Promise<{
              fold<T>(
                ok: (value: { temporaryPassword: string }) => T,
                err: () => T,
              ): T;
            }>;
          };
        };
      };
    const commands = (harness.app as INestApplicationContext).get(Commands);
    const temporaryPassword = (
      await commands.get(ProvisionLocalAccount).execute({
        realm: "operator",
        displayName: "Deputación · persoal",
        login: "operacion",
      })
    ).fold(
      (value) => value.temporaryPassword,
      () => "",
    );
    const browser = agent();
    const first = await post(browser, "public/auth/operator/password", {
      login: "operacion",
      password: temporaryPassword,
    }).expect(200);
    const changed = await post(browser, "public/auth/local/password-change", {
      ticket: first.body.ticket,
      newPassword: "operator pass phrase",
    }).expect(200);
    expect(changed.body.enrollment.otpauthUri).toContain("operaci%C3%B3n");
    const session = await post(browser, "public/auth/local/totp", {
      ticket: changed.body.ticket,
      code: totp(changed.body.enrollment.secret),
    }).expect(200);
    expect(session.body).toMatchObject({ displayName: "Deputación · persoal" });
    await browser.get("/v2/operator/municipalities").expect(200);
    // The demo sign-in only ever hands out the synthetic operator.
    const demo = agent();
    const opened = await post(demo, "public/operator-sessions", {}).expect(201);
    expect(opened.body.displayName).not.toBe("Deputación · persoal");
  });
  it("should never hand out a local account through the demo sign-in", async () => {
    const context = await tenant();
    await harness.db.query(
      "UPDATE users SET assurance='local' WHERE tenant_id=$1 AND role='manager'",
      [context.id],
    );
    await post(agent(), "public/sessions", {
      slug: context.slug,
      role: "manager",
    }).expect(404);
  });
});
