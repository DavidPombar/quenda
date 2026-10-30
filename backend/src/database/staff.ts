// SPDX-License-Identifier: AGPL-3.0-or-later
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { Commands } from "../v2/shared/infrastructure/commands.locator";
import { ProvisionLocalAccount } from "../v2/modules/identity/application/commands/provision-local-account.command";
import { ResetLocalAccount } from "../v2/modules/identity/application/commands/reset-local-account.command";
const usage = `Local accounts with password and second factor (#8)

  npm run staff -- create --slug <municipality> --login <login> --name "<name>" [--role manager|access]
  npm run staff -- create --operator --login <login> --name "<name>"
  npm run staff -- reset --slug <municipality> --login <login>
  npm run staff -- reset --operator --login <login>

Prints a temporary password once; the person replaces it and sets up an authenticator app at
the first sign-in. Needs QUENDA_DATA_KEY.`;
function option(args: string[], name: string) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}
export async function staff(args: string[]) {
  const [action] = args;
  const operator = args.includes("--operator");
  const login = option(args, "login");
  if (
    !["create", "reset"].includes(action) ||
    !login ||
    (!operator && !option(args, "slug"))
  ) {
    console.log(usage);
    process.exitCode = 1;
    return;
  }
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn"],
  });
  try {
    const commands = app.get(Commands);
    const realm = operator ? ("operator" as const) : ("tenant" as const);
    const result =
      action === "create"
        ? await commands.get(ProvisionLocalAccount).execute({
            realm,
            slug: option(args, "slug"),
            role: option(args, "role") === "access" ? "access" : "manager",
            displayName: option(args, "name") ?? login,
            login,
          })
        : await commands.get(ResetLocalAccount).execute({
            realm,
            slug: option(args, "slug"),
            login,
          });
    result.fold(
      (value) =>
        console.log(
          `Login: ${value.login}\nTemporary password (shown once): ${value.temporaryPassword}`,
        ),
      (error) => {
        console.error(`Not done: ${error.code}`);
        process.exitCode = 1;
      },
    );
  } finally {
    await app.close();
  }
}
if (require.main === module)
  void staff(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
