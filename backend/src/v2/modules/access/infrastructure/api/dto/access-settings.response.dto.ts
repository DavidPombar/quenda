// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { PublicSigningKey } from "../../../domain/credential-keys";
import { AccessWebhookSettings } from "../../../domain/access-webhook.repository";
import { SigningKeyResponseDTO } from "./signing-key.response.dto";
export class AccessSettingsResponseDTO {
  @ApiProperty({ type: SigningKeyResponseDTO }) key!: SigningKeyResponseDTO;
  @ApiProperty({ type: String, nullable: true }) webhookUrl!: string | null;
  @ApiProperty({ description: "A webhook secret is stored (never returned)" })
  hasWebhookSecret!: boolean;
  static from(value: {
    key: PublicSigningKey;
    webhook: AccessWebhookSettings;
  }): AccessSettingsResponseDTO {
    return {
      key: SigningKeyResponseDTO.from(value.key),
      webhookUrl: value.webhook.url,
      hasWebhookSecret: value.webhook.hasSecret,
    };
  }
}
