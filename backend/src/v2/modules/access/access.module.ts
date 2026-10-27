// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { FacilitiesModule } from "../facilities/facilities.module";
import { CredentialKeys } from "./domain/credential-keys";
import { AccessBookingRepository } from "./domain/access-booking.repository";
import { AccessWebhookRepository } from "./domain/access-webhook.repository";
import { PostgresCredentialKeys } from "./infrastructure/persistence/postgres-credential-keys";
import { PostgresAccessBookingRepository } from "./infrastructure/persistence/postgres-access-booking.repository";
import { PostgresAccessWebhookRepository } from "./infrastructure/persistence/postgres-access-webhook.repository";
import { CredentialIssuer } from "./application/credential-issuer";
import { GetCredential } from "./application/queries/get-credential.query";
import { ListAccessKeys } from "./application/queries/list-access-keys.query";
import { GetAccessSettings } from "./application/queries/get-access-settings.query";
import { CheckIn } from "./application/commands/check-in.command";
import { RotateSigningKey } from "./application/commands/rotate-signing-key.command";
import { ConfigureAccessWebhook } from "./application/commands/configure-access-webhook.command";
import { AccessWebhookDispatcher } from "./infrastructure/webhook/access-webhook-dispatcher";
import { GetCredentialController } from "./infrastructure/api/citizen/get-credential.controller";
import { ListAccessKeysController } from "./infrastructure/api/access/list-access-keys.controller";
import { CheckInController } from "./infrastructure/api/access/check-in.controller";
import { GetAccessSettingsController } from "./infrastructure/api/manager/get-access-settings.controller";
import { RotateSigningKeyController } from "./infrastructure/api/manager/rotate-signing-key.controller";
import { ConfigureAccessWebhookController } from "./infrastructure/api/manager/configure-access-webhook.controller";
/** Access control (M3): signed QR credentials, door check-in and the open webhook. */
@Module({
  imports: [FacilitiesModule],
  providers: [
    CredentialIssuer,
    GetCredential,
    ListAccessKeys,
    GetAccessSettings,
    CheckIn,
    RotateSigningKey,
    ConfigureAccessWebhook,
    AccessWebhookDispatcher,
    { provide: CredentialKeys, useClass: PostgresCredentialKeys },
    {
      provide: AccessBookingRepository,
      useClass: PostgresAccessBookingRepository,
    },
    {
      provide: AccessWebhookRepository,
      useClass: PostgresAccessWebhookRepository,
    },
  ],
  controllers: [
    GetCredentialController,
    ListAccessKeysController,
    CheckInController,
    GetAccessSettingsController,
    RotateSigningKeyController,
    ConfigureAccessWebhookController,
  ],
})
export class AccessModule {}
