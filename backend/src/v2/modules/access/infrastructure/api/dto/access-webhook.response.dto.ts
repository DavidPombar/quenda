// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
export class AccessWebhookResponseDTO {
  @ApiProperty({ description: "Configured endpoint" }) url!: string;
  @ApiProperty({
    description: "New signing secret, shown only this once",
    type: String,
    nullable: true,
  })
  secret!: string | null;
}
