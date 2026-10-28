// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  Assurance,
  Role,
  Principal,
} from "../../../../../shared/application/principal";
export class SessionResponseDTO {
  @ApiProperty({ description: "Authenticated user UUID" }) userId!: string;
  @ApiProperty({ description: "Authenticated municipality UUID" })
  tenantId!: string;
  @ApiProperty({ description: "Display name" }) displayName!: string;
  @ApiProperty({
    description: "Demo account role",
    enum: ["citizen", "manager", "access"],
  })
  role!: Role;
  @ApiProperty({
    description:
      "How the identity was proven: demo account, e-mail code, eID (OIDC) or local credentials",
    enum: ["demo", "email", "eid", "local"],
  })
  assurance!: Assurance;
  static from(value: Principal): SessionResponseDTO {
    return {
      userId: value.userId,
      tenantId: value.tenantId,
      displayName: value.displayName,
      role: value.role,
      assurance: value.assurance,
    };
  }
}
