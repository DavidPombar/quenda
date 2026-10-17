// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Principal } from "../../../../../shared/application/principal";
export class SessionResponseDTO {
  @ApiProperty({ description: "Authenticated user UUID" }) userId!: string;
  @ApiProperty({ description: "Authenticated municipality UUID" })
  tenantId!: string;
  @ApiProperty({ description: "Display name" }) displayName!: string;
  @ApiProperty({ description: "Demo account role" }) role!:
    "citizen" | "manager";
  static from(value: Principal): SessionResponseDTO {
    return {
      userId: value.userId,
      tenantId: value.tenantId,
      displayName: value.displayName,
      role: value.role,
    };
  }
}
