// SPDX-License-Identifier: AGPL-3.0-or-later
import "reflect-metadata";
import { parseArgs } from "node:util";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { Clock } from "../v2/shared/application/clock";
import { Municipalities } from "../v2/shared/application/municipality-settings";
import { Commands } from "../v2/shared/infrastructure/commands.locator";
import { CreateManager } from "../v2/modules/operators/application/commands/create-manager.command";
import { ExternalIdentityRepository } from "../v2/modules/identity/domain/external-identity.repository";
import {
  EMAIL_ISSUER,
  emailHash,
  normaliseEmail,
} from "../v2/modules/identity/domain/email-code";
import { consolePrincipal, fail, runCommand, stableId } from "./onboarding";
const USAGE = `Adds a manager to a municipality (#27).

  node backend/dist/database/add-manager.js --municipality vilaverde \\
    --name "Ana Rivas" --email ana.rivas@vilaverde.gal

The manager signs in with a one-time code sent to that address (SMTP_URL must be set),
from the citizen app of the municipality, and then opens the backoffice.`;
export async function addManager(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      municipality: { type: "string" },
      name: { type: "string" },
      email: { type: "string" },
    },
  });
  const email = normaliseEmail(values.email ?? "");
  if (!values.municipality || !values.name?.trim() || !email) fail(USAGE);
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn"],
  });
  try {
    const municipality = await app
      .get(Municipalities)
      .findBySlug(values.municipality);
    if (!municipality) fail(`There is no municipality ${values.municipality}.`);
    const identities = app.get(ExternalIdentityRepository, { strict: false });
    const subject = emailHash(email);
    const id = stableId("manager", municipality.id, email);
    const linked = await identities.findUser(
      municipality.id,
      EMAIL_ISSUER,
      subject,
    );
    if (linked && linked.userId !== id)
      fail(
        `${email} already has a citizen account in ${municipality.name}; ` +
          "use another address for the manager.",
      );
    const result = await app
      .get(Commands)
      .get(CreateManager)
      .execute({
        principal: await consolePrincipal(app),
        municipalityId: municipality.id,
        id,
        displayName: values.name,
        email,
      });
    if (result.isFailure)
      fail(`${email} is already a manager there with another name.`);
    if (!linked)
      await identities.link({
        id: stableId("identity", municipality.id, email),
        tenantId: municipality.id,
        userId: id,
        issuer: EMAIL_ISSUER,
        subject,
        createdAt: app.get(Clock).now(),
      });
    console.log(
      `${values.name.trim()} manages ${municipality.name}. Sign in at /app/${municipality.slug}/ ` +
        `with ${email}, then open /admin/${municipality.slug}/.`,
    );
  } finally {
    await app.close();
  }
}
if (require.main === module) runCommand(addManager);
