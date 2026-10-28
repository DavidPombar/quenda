// SPDX-License-Identifier: AGPL-3.0-or-later
import { AsyncLocalStorage } from "node:async_hooks";
import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Pool, PoolClient, QueryResultRow, types } from "pg";
import { currentDatabaseUrl } from "../../../database/config";
import { Result } from "../application/result";
types.setTypeParser(1184, (value) => value);
types.setTypeParser(1114, (value) => value);
class Rollback extends Error {}
@Injectable()
export class Database implements OnModuleDestroy {
  private readonly pool = new Pool({ connectionString: currentDatabaseUrl() });
  private readonly context = new AsyncLocalStorage<PoolClient>();
  query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    values: unknown[] = [],
  ) {
    return (this.context.getStore() ?? this.pool).query<T>(sql, values);
  }
  /** The command boundary owns transactions; an error Result rolls back all effects. */
  async transaction<T, E>(
    run: () => Promise<Result<T, E>>,
  ): Promise<Result<T, E>> {
    const client = await this.pool.connect();
    let result: Result<T, E> | undefined;
    try {
      await client.query("BEGIN");
      result = await this.context.run(client, run);
      if (result.isFailure) throw new Rollback();
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      if (error instanceof Rollback && result) return result;
      throw error;
    } finally {
      client.release();
    }
  }
  async onModuleDestroy() {
    await this.pool.end();
  }
}
