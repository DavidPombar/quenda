// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { StaffMember } from "../../../domain/deployment.repository";
export class StaffMemberResponseDTO {
  @ApiProperty({ description: "Manager UUID" }) id!: string;
  @ApiProperty({ description: "Municipality UUID" }) municipalityId!: string;
  @ApiProperty({ description: "Display name" }) displayName!: string;
  @ApiProperty({ type: String, nullable: true, description: "Work address" })
  email!: string | null;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: "Local account login",
  })
  login?: string | null;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      "Temporary password, only in the answer that created or reset the account",
  })
  temporaryPassword?: string | null;
  static from(
    value: StaffMember & {
      login?: string | null;
      temporaryPassword?: string | null;
    },
  ): StaffMemberResponseDTO {
    return {
      id: value.id,
      municipalityId: value.tenantId,
      displayName: value.displayName,
      email: value.email,
      ...(value.login !== undefined ? { login: value.login } : {}),
      ...(value.temporaryPassword !== undefined
        ? { temporaryPassword: value.temporaryPassword }
        : {}),
    };
  }
}
