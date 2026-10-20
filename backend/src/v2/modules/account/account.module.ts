// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { AccountRepository } from "./domain/account.repository";
import { ConsentRepository } from "./domain/consent.repository";
import { PostgresAccountRepository } from "./infrastructure/persistence/postgres-account.repository";
import { PostgresConsentRepository } from "./infrastructure/persistence/postgres-consent.repository";
import { GetAccount } from "./application/queries/get-account.query";
import { ExportAccount } from "./application/queries/export-account.query";
import { DeleteAccount } from "./application/commands/delete-account.command";
import { GetAccountController } from "./infrastructure/api/citizen/get-account.controller";
import { ExportAccountController } from "./infrastructure/api/citizen/export-account.controller";
import { DeleteAccountController } from "./infrastructure/api/citizen/delete-account.controller";
@Module({
  providers: [
    GetAccount,
    ExportAccount,
    DeleteAccount,
    { provide: AccountRepository, useClass: PostgresAccountRepository },
    { provide: ConsentRepository, useClass: PostgresConsentRepository },
  ],
  controllers: [
    GetAccountController,
    ExportAccountController,
    DeleteAccountController,
  ],
  exports: [ConsentRepository],
})
export class AccountModule {}
