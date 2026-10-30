// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash } from "node:crypto";
import type { INestApplicationContext } from "@nestjs/common";
import { Database } from "../v2/shared/infrastructure/database";
import type { OperatorPrincipal } from "../v2/shared/application/operator-principal";
/**
 * The server console acts as the deployment's operator for onboarding (#27): until staff
 * sign in with a real identity provider (#8), the operator pages only work in the demo.
 * Its actions are recorded in the operator trail under this name.
 */
export const CONSOLE_OPERATOR = {
  id: "40000000-0000-4000-8000-0000000000c0",
  displayName: "Consola do servidor",
};
export async function consolePrincipal(
  app: INestApplicationContext,
): Promise<OperatorPrincipal> {
  await app
    .get(Database)
    .query(
      "INSERT INTO operators (id,display_name) VALUES ($1,$2) ON CONFLICT(id) DO NOTHING",
      [CONSOLE_OPERATOR.id, CONSOLE_OPERATOR.displayName],
    );
  return {
    operatorId: CONSOLE_OPERATOR.id,
    displayName: CONSOLE_OPERATOR.displayName,
    grants: ["deployment:manage"],
  };
}
/** The same input always gives the same id, so running a command twice is harmless. */
export function stableId(...parts: string[]) {
  const hex = createHash("sha256").update(parts.join("\n")).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${((parseInt(hex[16], 16) & 3) | 8).toString(16)}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}
/** A problem the person running the command can fix; printed without a stack trace. */
export class OnboardingError extends Error {}
export function fail(message: string): never {
  throw new OnboardingError(message);
}
/** Runs a console command, printing its problems and setting the exit code. */
export function runCommand(command: (argv: string[]) => Promise<void>) {
  void command(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof OnboardingError ? error.message : error);
    process.exitCode = 1;
  });
}
