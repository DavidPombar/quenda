// SPDX-License-Identifier: AGPL-3.0-or-later
import { Global, Module } from "@nestjs/common";
import { Clock } from "./application/clock";
import { IdGenerator } from "./application/id-generator";
import { Audit } from "./application/audit";
import { SecretGenerator } from "./application/secret-generator";
import { DataProtector } from "./application/data-protector";
import { NodeSecretGenerator } from "./infrastructure/node-secret-generator";
import { AesDataProtector } from "./infrastructure/aes-data-protector";
import { Municipalities } from "./application/municipality-settings";
import { Outbox } from "./application/outbox";
import { UnsubscribeTokens } from "./application/unsubscribe-tokens";
import { Database } from "./infrastructure/database";
import { Commands } from "./infrastructure/commands.locator";
import { Queries } from "./infrastructure/queries.locator";
import { SystemClock } from "./infrastructure/system-clock";
import { UuidGenerator } from "./infrastructure/uuid-generator";
import { PostgresAudit } from "./infrastructure/postgres-audit";
import { PostgresMunicipalities } from "./infrastructure/postgres-municipalities";
import { PostgresOutbox } from "./infrastructure/postgres-outbox";
import { HmacUnsubscribeTokens } from "./infrastructure/hmac-unsubscribe-tokens";
import { PrincipalGuard } from "./infrastructure/api/principal.guard";
import { SessionRepository } from "../modules/identity/domain/session.repository";
import { PostgresSessionRepository } from "../modules/identity/infrastructure/persistence/postgres-session.repository";
const bindings = [
  { provide: Clock, useClass: SystemClock },
  { provide: IdGenerator, useClass: UuidGenerator },
  { provide: Audit, useClass: PostgresAudit },
  { provide: Municipalities, useClass: PostgresMunicipalities },
  { provide: Outbox, useClass: PostgresOutbox },
  { provide: UnsubscribeTokens, useClass: HmacUnsubscribeTokens },
  { provide: SessionRepository, useClass: PostgresSessionRepository },
  { provide: SecretGenerator, useClass: NodeSecretGenerator },
  {
    provide: DataProtector,
    useFactory: () => new AesDataProtector(process.env.QUENDA_DATA_KEY),
  },
];
@Global()
@Module({
  providers: [Database, Commands, Queries, PrincipalGuard, ...bindings],
  exports: [
    Database,
    Commands,
    Queries,
    PrincipalGuard,
    ...bindings.map((binding) => binding.provide),
  ],
})
export class SharedModule {}
