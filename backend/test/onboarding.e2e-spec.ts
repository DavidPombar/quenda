// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { harness, setupWith, teardown } from "./harness";
import { FakeSmtp } from "./fake-smtp";
const require = createRequire(import.meta.url);
type Command = (argv: string[]) => Promise<void>;
const { createMunicipality } =
  require("../dist/database/create-municipality.js") as {
    createMunicipality: Command;
  };
const { addManager } = require("../dist/database/add-manager.js") as {
  addManager: Command;
};
const smtp = new FakeSmtp();
let notices: { gl: string; es: string };
beforeAll(async () => {
  await smtp.start();
  await setupWith({
    env: () => ({ SMTP_URL: smtp.url, EMAIL_LOGIN: undefined }),
  });
  const dir = await mkdtemp(join(tmpdir(), "quenda-onboarding-"));
  notices = { gl: join(dir, "gl.txt"), es: join(dir, "es.txt") };
  await writeFile(
    notices.gl,
    "Aviso de privacidade do Concello de Ribadeproba.",
  );
  await writeFile(
    notices.es,
    "Aviso de privacidad del Concello de Ribadeproba.",
  );
});
afterAll(async () => {
  await teardown();
  await smtp.stop();
});
const create = (name = "Concello de Ribadeproba") =>
  createMunicipality([
    "--slug",
    "ribadeproba",
    "--name",
    name,
    "--contact",
    "Deportes: deportes@ribadeproba.example",
    "--privacy-gl",
    notices.gl,
    "--privacy-es",
    notices.es,
  ]);
const add = (email: string, name = "Ana Rivas") =>
  addManager([
    "--municipality",
    "ribadeproba",
    "--name",
    name,
    "--email",
    email,
  ]);
async function signIn(email: string) {
  const agent = request.agent(harness.app.getHttpServer());
  const { body: municipalities } = await agent.get("/v2/public/municipalities");
  const { legalVersion } = (
    municipalities as { slug: string; legalVersion: string }[]
  ).find((value) => value.slug === "ribadeproba")!;
  await agent
    .post("/v2/public/auth/email/codes")
    .set("X-Quenda-Request", "1")
    .send({ slug: "ribadeproba", email, legalVersion })
    .expect(202);
  const mail = smtp.mails.filter((value) => value.to === email).at(-1);
  const code = /\b([0-9]{6})\b/.exec(mail?.data ?? "")?.[1] ?? "";
  const { body } = await agent
    .post("/v2/public/auth/email/sessions")
    .set("X-Quenda-Request", "1")
    .send({ slug: "ribadeproba", email, code })
    .expect(201);
  return { agent, session: body as { role: string; displayName: string } };
}
describe("Onboarding a council from the server console (#27)", () => {
  it("should create the council once and refuse its slug for another name", async () => {
    await create();
    await create();
    await expect(create("Concello de Outrolugar")).rejects.toThrow(
      "ribadeproba already exists with another name.",
    );
    const { rows } = await harness.db.query(
      `SELECT m.name, l.text_gl, o.display_name AS operator
         FROM municipalities m
         JOIN legal_texts l ON l.tenant_id = m.id
         JOIN operator_audit_events e ON e.tenant_id = m.id AND e.action = 'municipality.created'
         JOIN operators o ON o.id = e.actor_id
        WHERE m.slug = 'ribadeproba'`,
    );
    expect(rows).toEqual([
      {
        name: "Concello de Ribadeproba",
        text_gl: "Aviso de privacidade do Concello de Ribadeproba.",
        operator: "Consola do servidor",
      },
    ]);
  });
  it("should let the manager sign in with an email code and open the backoffice data", async () => {
    await add("Ana.Rivas@ribadeproba.example");
    await add("ana.rivas@ribadeproba.example");
    const { agent, session } = await signIn("ana.rivas@ribadeproba.example");
    expect(session).toMatchObject({
      role: "manager",
      displayName: "Ana Rivas",
    });
    await agent.get("/v2/manager/municipality").expect(200);
  });
  it("should refuse an address that already has a citizen account", async () => {
    await signIn("vecina@ribadeproba.example");
    await expect(add("vecina@ribadeproba.example", "Veciña")).rejects.toThrow(
      "already has a citizen account",
    );
  });
});
