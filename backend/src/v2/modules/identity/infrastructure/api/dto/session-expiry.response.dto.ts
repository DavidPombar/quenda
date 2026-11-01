// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
export class SessionExpiryResponseDTO {
  @ApiProperty({ description: "When the session ends (ISO 8601 instant)" })
  expiresAt!: string;
}
