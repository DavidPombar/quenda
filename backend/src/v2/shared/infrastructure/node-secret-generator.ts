// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomBytes, randomInt } from "node:crypto";
import { SecretGenerator } from "../application/secret-generator";
export class NodeSecretGenerator extends SecretGenerator {
  randomToken(bytes: number) {
    return randomBytes(bytes).toString("base64url");
  }
  numericCode(digits: number) {
    return Array.from({ length: digits }, () => randomInt(10)).join("");
  }
}
