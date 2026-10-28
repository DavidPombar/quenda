// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { AccessSettings } from "../../../domain/access.read-model";
import { AccessKeyResponseDTO } from "./access-key.response.dto";
export class AccessSettingsResponseDTO {
  @ApiProperty({ description: "Access-control webhook; empty when disabled" })
  webhookUrl!: string;
  @ApiProperty({ description: "Whether a signing secret exists" })
  hasWebhookSecret!: boolean;
  @ApiProperty({ type: [AccessKeyResponseDTO] })
  keys!: AccessKeyResponseDTO[];
  static from(value: AccessSettings): AccessSettingsResponseDTO {
    return {
      webhookUrl: value.webhookUrl,
      hasWebhookSecret: value.hasWebhookSecret,
      keys: value.keys.map(AccessKeyResponseDTO.from),
    };
  }
}
