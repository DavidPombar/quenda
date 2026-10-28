// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { AccountModule } from "../account/account.module";
import { CreateSession } from "./application/commands/create-session.command";
import { DeleteSession } from "./application/commands/delete-session.command";
import { StartOidcLogin } from "./application/commands/start-oidc-login.command";
import { ConsumeLoginAttempt } from "./application/commands/consume-login-attempt.command";
import { CompleteOidcLogin } from "./application/commands/complete-oidc-login.command";
import { PurgeExpiredSessions } from "./application/commands/purge-expired-sessions.command";
import { GetSession } from "./application/queries/get-session.query";
import { GetAuthMethods } from "./application/queries/get-auth-methods.query";
import { ExchangeOidcCode } from "./application/queries/exchange-oidc-code.query";
import { OidcProvider } from "./domain/oidc-provider";
import { LoginAttemptRepository } from "./domain/login-attempt.repository";
import { ExternalIdentityRepository } from "./domain/external-identity.repository";
import { OpenIdOidcProvider } from "./infrastructure/oidc/openid-oidc-provider";
import { PostgresLoginAttemptRepository } from "./infrastructure/persistence/postgres-login-attempt.repository";
import { PostgresExternalIdentityRepository } from "./infrastructure/persistence/postgres-external-identity.repository";
import { CreateSessionController } from "./infrastructure/api/public/create-session.controller";
import { DeleteSessionController } from "./infrastructure/api/public/delete-session.controller";
import { GetSessionController } from "./infrastructure/api/public/get-session.controller";
import { GetAuthMethodsController } from "./infrastructure/api/public/get-auth-methods.controller";
import { StartOidcLoginController } from "./infrastructure/api/public/start-oidc-login.controller";
import { CompleteOidcLoginController } from "./infrastructure/api/public/complete-oidc-login.controller";
import { SessionPurgeScheduler } from "./infrastructure/schedule/session-purge.scheduler";
@Module({
  imports: [AccountModule],
  providers: [
    CreateSession,
    DeleteSession,
    GetSession,
    GetAuthMethods,
    StartOidcLogin,
    ConsumeLoginAttempt,
    ExchangeOidcCode,
    CompleteOidcLogin,
    { provide: OidcProvider, useClass: OpenIdOidcProvider },
    {
      provide: LoginAttemptRepository,
      useClass: PostgresLoginAttemptRepository,
    },
    {
      provide: ExternalIdentityRepository,
      useClass: PostgresExternalIdentityRepository,
    },
    PurgeExpiredSessions,
    SessionPurgeScheduler,
  ],
  controllers: [
    CreateSessionController,
    DeleteSessionController,
    GetSessionController,
    GetAuthMethodsController,
    StartOidcLoginController,
    CompleteOidcLoginController,
  ],
})
export class IdentityModule {}
