// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  Permission,
  Principal,
  Role,
} from "../../../../../shared/application/principal";
export class SessionResponseDTO {
  @ApiProperty({ description: "Authenticated user UUID" }) userId!: string;
  @ApiProperty({ description: "Authenticated municipality UUID" })
  tenantId!: string;
  @ApiProperty({ description: "Display name" }) displayName!: string;
  @ApiProperty({ description: "Demo account role" }) role!: Role;
  @ApiProperty({
    description:
      "Permissions granted to the role; frontends only use them to adapt navigation",
    isArray: true,
    type: String,
  })
  grants!: Permission[];
  static from(value: Principal): SessionResponseDTO {
    return {
      userId: value.userId,
      tenantId: value.tenantId,
      displayName: value.displayName,
      role: value.role,
      grants: [...value.grants],
    };
  }
}
