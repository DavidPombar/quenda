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
import { RequestEmailCode } from "./application/commands/request-email-code.command";
import { VerifyEmailCode } from "./application/commands/verify-email-code.command";
import { ClaimLoginCodes } from "./application/commands/claim-login-codes.command";
import { CompleteLoginCode } from "./application/commands/complete-login-code.command";
import { LoginCodeRepository } from "./domain/login-code.repository";
import { PostgresLoginCodeRepository } from "./infrastructure/persistence/postgres-login-code.repository";
import { LoginCodeSender } from "./infrastructure/mail/login-code-sender";
import { CredentialRepository } from "./domain/credential.repository";
import { PostgresCredentialRepository } from "./infrastructure/persistence/postgres-credential.repository";
import { CredentialIssuer } from "./application/credential-issuer";
import { StaffLogin } from "./application/staff-login";
import { StaffAudit } from "./application/staff-audit";
import { StartPasswordLogin } from "./application/commands/start-password-login.command";
import { ChangeTemporaryPassword } from "./application/commands/change-temporary-password.command";
import { CompleteTotpLogin } from "./application/commands/complete-totp-login.command";
import { StaffPasswordLoginController } from "./infrastructure/api/public/staff-password-login.controller";
import { OperatorPasswordLoginController } from "./infrastructure/api/public/operator-password-login.controller";
import { ChangeTemporaryPasswordController } from "./infrastructure/api/public/change-temporary-password.controller";
import { CompleteTotpLoginController } from "./infrastructure/api/public/complete-totp-login.controller";
import { ListStaff } from "./application/queries/list-staff.query";
import { ProvisionLocalAccount } from "./application/commands/provision-local-account.command";
import { ResetLocalAccount } from "./application/commands/reset-local-account.command";
import { CreateDoorStaff } from "./application/commands/create-door-staff.command";
import { UpdateDoorStaff } from "./application/commands/update-door-staff.command";
import { ListStaffController } from "./infrastructure/api/manager/list-staff.controller";
import { CreateDoorStaffController } from "./infrastructure/api/manager/create-door-staff.controller";
import { UpdateDoorStaffController } from "./infrastructure/api/manager/update-door-staff.controller";
import { RequestEmailCodeController } from "./infrastructure/api/public/request-email-code.controller";
import { VerifyEmailCodeController } from "./infrastructure/api/public/verify-email-code.controller";
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
    RequestEmailCode,
    VerifyEmailCode,
    ClaimLoginCodes,
    CompleteLoginCode,
    LoginCodeSender,
    { provide: LoginCodeRepository, useClass: PostgresLoginCodeRepository },
    { provide: CredentialRepository, useClass: PostgresCredentialRepository },
    CredentialIssuer,
    StaffLogin,
    StaffAudit,
    StartPasswordLogin,
    ChangeTemporaryPassword,
    CompleteTotpLogin,
    ListStaff,
    ProvisionLocalAccount,
    ResetLocalAccount,
    CreateDoorStaff,
    UpdateDoorStaff,
  ],
  controllers: [
    CreateSessionController,
    DeleteSessionController,
    GetSessionController,
    GetAuthMethodsController,
    StartOidcLoginController,
    CompleteOidcLoginController,
    RequestEmailCodeController,
    VerifyEmailCodeController,
    StaffPasswordLoginController,
    OperatorPasswordLoginController,
    ChangeTemporaryPasswordController,
    CompleteTotpLoginController,
    ListStaffController,
    CreateDoorStaffController,
    UpdateDoorStaffController,
  ],
  exports: [LoginCodeSender, CredentialIssuer, CredentialRepository],
})
export class IdentityModule {}
