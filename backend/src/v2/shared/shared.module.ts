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
import { SecretBox } from "./application/secret-box";
import { UnsubscribeTokens } from "./application/unsubscribe-tokens";
import { PushSender } from "./application/push-sender";
import { Mailer } from "./application/mailer";
import { SmtpMailer } from "./infrastructure/smtp-mailer";
import { AnalyticsForwarder } from "./application/analytics-forwarder";
import { AnalyticsConfig } from "./application/analytics-config";
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
import { WebPushSender } from "./infrastructure/web-push-sender";
import { FetchAnalyticsForwarder } from "./infrastructure/fetch-analytics-forwarder";
import { EnvAnalyticsConfig } from "./infrastructure/env-analytics-config";
import { PrincipalGuard } from "./infrastructure/api/principal.guard";
import { OperatorGuard } from "./infrastructure/api/operator.guard";
import { OperatorAudit } from "./application/operator-audit";
import { PostgresOperatorAudit } from "./infrastructure/postgres-operator-audit";
import { OperatorSessionRepository } from "../modules/operators/domain/operator-session.repository";
import { PostgresOperatorSessionRepository } from "../modules/operators/infrastructure/persistence/postgres-operator-session.repository";
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
  { provide: PushSender, useClass: WebPushSender },
  { provide: Mailer, useClass: SmtpMailer },
  { provide: AnalyticsConfig, useClass: EnvAnalyticsConfig },
  { provide: AnalyticsForwarder, useClass: FetchAnalyticsForwarder },
  { provide: SessionRepository, useClass: PostgresSessionRepository },
  { provide: OperatorAudit, useClass: PostgresOperatorAudit },
  {
    provide: OperatorSessionRepository,
    useClass: PostgresOperatorSessionRepository,
  },
  { provide: SecretGenerator, useClass: NodeSecretGenerator },
  {
    provide: DataProtector,
    useFactory: () => new AesDataProtector(process.env.QUENDA_DATA_KEY),
  },
];
@Global()
@Module({
  providers: [
    Database,
    Commands,
    Queries,
    PrincipalGuard,
    OperatorGuard,
    ...bindings,
  ],
  exports: [
    Database,
    Commands,
    Queries,
    PrincipalGuard,
    OperatorGuard,
    ...bindings.map((binding) => binding.provide),
  ],
})
export class SharedModule {}
