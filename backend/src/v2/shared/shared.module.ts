// SPDX-License-Identifier: AGPL-3.0-or-later
import { Global, Module } from "@nestjs/common";
import { Clock } from "./application/clock";
import { IdGenerator } from "./application/id-generator";
import { Audit } from "./application/audit";
import { Municipalities } from "./application/municipality-settings";
import { Outbox } from "./application/outbox";
import { SecretBox } from "./application/secret-box";
import { UnsubscribeTokens } from "./application/unsubscribe-tokens";
import { Database } from "./infrastructure/database";
import { Commands } from "./infrastructure/commands.locator";
import { Queries } from "./infrastructure/queries.locator";
import { SystemClock } from "./infrastructure/system-clock";
import { UuidGenerator } from "./infrastructure/uuid-generator";
import { PostgresAudit } from "./infrastructure/postgres-audit";
import { PostgresMunicipalities } from "./infrastructure/postgres-municipalities";
import { PostgresOutbox } from "./infrastructure/postgres-outbox";
import { AesSecretBox } from "./infrastructure/aes-secret-box";
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
  { provide: SecretBox, useClass: AesSecretBox },
  { provide: UnsubscribeTokens, useClass: HmacUnsubscribeTokens },
  { provide: SessionRepository, useClass: PostgresSessionRepository },
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
