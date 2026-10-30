// SPDX-License-Identifier: AGPL-3.0-or-later
import "reflect-metadata";
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { Commands } from "../v2/shared/infrastructure/commands.locator";
import { CreateMunicipality } from "../v2/modules/operators/application/commands/create-municipality.command";
import { consolePrincipal, fail, runCommand, stableId } from "./onboarding";
const USAGE = `Creates a municipality in this deployment (#27).

  node backend/dist/database/create-municipality.js --slug vilaverde \\
    --name "Concello de Vilaverde" --contact "Deportes: 986 000 000, deportes@vilaverde.gal" \\
    --privacy-gl aviso-gl.txt --privacy-es aviso-es.txt [--timezone Europe/Madrid] [--locale gl]

The privacy notices are plain-text files approved by the council's data protection officer.
Booking rules start at 14 days ahead, 2 hours to cancel and 5 active bookings; the manager
changes them and everything else under Axustes.`;
export async function createMunicipality(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      slug: { type: "string" },
      name: { type: "string" },
      contact: { type: "string" },
      "privacy-gl": { type: "string" },
      "privacy-es": { type: "string" },
      timezone: { type: "string", default: "Europe/Madrid" },
      locale: { type: "string", default: "gl" },
    },
  });
  const { slug, name, contact } = values;
  if (
    !slug ||
    !name ||
    !contact ||
    !values["privacy-gl"] ||
    !values["privacy-es"]
  )
    fail(USAGE);
  if (!/^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])$/.test(slug))
    fail("The slug takes 3–64 lower-case letters, digits and hyphens.");
  if (values.locale !== "gl" && values.locale !== "es")
    fail("The locale is gl or es.");
  const legalTexts = {
    gl: await readFile(values["privacy-gl"], "utf8"),
    es: await readFile(values["privacy-es"], "utf8"),
  };
  if (legalTexts.gl.trim().length < 20 || legalTexts.es.trim().length < 20)
    fail("Each privacy notice needs at least 20 characters.");
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn"],
  });
  try {
    const result = await app
      .get(Commands)
      .get(CreateMunicipality)
      .execute({
        principal: await consolePrincipal(app),
        id: stableId("municipality", slug),
        slug,
        name,
        timezone: values.timezone,
        locale: values.locale,
        contact,
        legalTexts,
      });
    result.fold(
      (municipality) =>
        console.log(
          `Created ${municipality.name}: /app/${municipality.slug}/ and /admin/${municipality.slug}/`,
        ),
      (error) =>
        fail(
          {
            slug_taken: `The slug ${slug} is already used.`,
            id_reused: `${slug} already exists with another name.`,
            validation: "Check the time zone and the name.",
            forbidden: "Not allowed.",
          }[error.code],
        ),
    );
  } finally {
    await app.close();
  }
}
if (require.main === module) runCommand(createMunicipality);
