// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Operation } from "../application/operation";
@Injectable()
export class Queries {
  private readonly logger = new Logger(Queries.name);
  constructor(private readonly modules: ModuleRef) {}
  get<A, O, E>(type: Type<Operation<A, O, E>>): Operation<A, O, E> {
    const target = this.modules.get(type, { strict: false });
    return {
      execute: async (args: A) => {
        try {
          const result = await target.execute(args);
          if (result.isFailure) this.logger.warn(`${type.name}: rejected`);
          return result;
        } catch (error) {
          this.logger.error(`${type.name}: failed`);
          throw error;
        }
      },
    };
  }
}
