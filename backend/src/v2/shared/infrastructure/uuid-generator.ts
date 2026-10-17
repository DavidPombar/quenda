// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomUUID } from "node:crypto";
import { IdGenerator } from "../application/id-generator";
export class UuidGenerator extends IdGenerator {
  next() {
    return randomUUID();
  }
}
