// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { FacilitiesModule } from "../facilities/facilities.module";
import { AccessRepository } from "./domain/access.repository";
import { AccessKeyRepository } from "./domain/access-key.repository";
import { AccessSigner } from "./application/access-signer";
import { AccessWindow } from "./application/access-window";
import { PostgresAccessRepository } from "./infrastructure/persistence/postgres-access.repository";
import { PostgresAccessKeyRepository } from "./infrastructure/persistence/postgres-access-key.repository";
import { NodeAccessSigner } from "./infrastructure/crypto/node-access-signer";
import { IssueAccessPass } from "./application/commands/issue-access-pass.command";
import { RotateAccessKey } from "./application/commands/rotate-access-key.command";
import { RecordCheckIns } from "./application/commands/record-check-ins.command";
import { UpdateAccessWebhook } from "./application/commands/update-access-webhook.command";
import { GetJwks } from "./application/queries/get-jwks.query";
import { GetAccessDay } from "./application/queries/get-access-day.query";
import { GetAccessSettings } from "./application/queries/get-access-settings.query";
import { IssueAccessPassController } from "./infrastructure/api/citizen/issue-access-pass.controller";
import { GetJwksController } from "./infrastructure/api/public/get-jwks.controller";
import { GetAccessDayController } from "./infrastructure/api/access/get-access-day.controller";
import { RecordCheckInsController } from "./infrastructure/api/access/record-check-ins.controller";
import { GetAccessSettingsController } from "./infrastructure/api/manager/get-access-settings.controller";
import { RotateAccessKeyController } from "./infrastructure/api/manager/rotate-access-key.controller";
import { UpdateAccessWebhookController } from "./infrastructure/api/manager/update-access-webhook.controller";
@Module({
  imports: [FacilitiesModule],
  providers: [
    AccessWindow,
    IssueAccessPass,
    RotateAccessKey,
    RecordCheckIns,
    UpdateAccessWebhook,
    GetJwks,
    GetAccessDay,
    GetAccessSettings,
    { provide: AccessRepository, useClass: PostgresAccessRepository },
    { provide: AccessKeyRepository, useClass: PostgresAccessKeyRepository },
    { provide: AccessSigner, useClass: NodeAccessSigner },
  ],
  controllers: [
    IssueAccessPassController,
    GetJwksController,
    GetAccessDayController,
    RecordCheckInsController,
    GetAccessSettingsController,
    RotateAccessKeyController,
    UpdateAccessWebhookController,
  ],
  exports: [AccessWindow],
})
export class AccessModule {}
