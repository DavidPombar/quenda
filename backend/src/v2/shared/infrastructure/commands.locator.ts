// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Operation } from "../application/operation";
import { Database } from "./database";
@Injectable()
export class Commands {
  private readonly logger = new Logger(Commands.name);
  constructor(
    private readonly modules: ModuleRef,
    private readonly db: Database,
  ) {}
  get<A, O, E>(type: Type<Operation<A, O, E>>): Operation<A, O, E> {
    const target = this.modules.get(type, { strict: false });
    return {
      execute: async (args: A) => {
        try {
          const result = await this.db.transaction(() => target.execute(args));
          if (result.isFailure) this.logger.warn(`${type.name}: rejected`);
          else this.logger.log(`${type.name}: committed`);
          return result;
        } catch (error) {
          this.logger.error(`${type.name}: failed`);
          throw error;
        }
      },
    };
  }
}
