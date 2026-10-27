// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { AccountRepository } from "./domain/account.repository";
import { ConsentRepository } from "./domain/consent.repository";
import { PostgresAccountRepository } from "./infrastructure/persistence/postgres-account.repository";
import { PostgresConsentRepository } from "./infrastructure/persistence/postgres-consent.repository";
import { GetAccount } from "./application/queries/get-account.query";
import { ExportAccount } from "./application/queries/export-account.query";
import { DeleteAccount } from "./application/commands/delete-account.command";
import { UpdateAccount } from "./application/commands/update-account.command";
import { UpdateNotificationPreferences } from "./application/commands/update-notification-preferences.command";
import { Unsubscribe } from "./application/commands/unsubscribe.command";
import { GetAccountController } from "./infrastructure/api/citizen/get-account.controller";
import { ExportAccountController } from "./infrastructure/api/citizen/export-account.controller";
import { DeleteAccountController } from "./infrastructure/api/citizen/delete-account.controller";
import { UpdateAccountController } from "./infrastructure/api/citizen/update-account.controller";
import { UpdateNotificationPreferencesController } from "./infrastructure/api/citizen/update-notification-preferences.controller";
import { UnsubscribeController } from "./infrastructure/api/public/unsubscribe.controller";
@Module({
  providers: [
    GetAccount,
    ExportAccount,
    DeleteAccount,
    UpdateAccount,
    UpdateNotificationPreferences,
    Unsubscribe,
    { provide: AccountRepository, useClass: PostgresAccountRepository },
    { provide: ConsentRepository, useClass: PostgresConsentRepository },
  ],
  controllers: [
    GetAccountController,
    ExportAccountController,
    DeleteAccountController,
    UpdateAccountController,
    UpdateNotificationPreferencesController,
    UnsubscribeController,
  ],
  exports: [ConsentRepository],
})
export class AccountModule {}
