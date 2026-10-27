// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
export class ConfigureAccessWebhookResponseDTO {
  @ApiProperty({ type: String, nullable: true }) url!: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "New Standard Webhooks secret; shown only this once",
  })
  secret!: string | null;
}
