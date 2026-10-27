// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { StaffMember } from "../../../domain/deployment.repository";
export class StaffMemberResponseDTO {
  @ApiProperty({ description: "Manager UUID" }) id!: string;
  @ApiProperty({ description: "Municipality UUID" }) municipalityId!: string;
  @ApiProperty({ description: "Display name" }) displayName!: string;
  @ApiProperty({ type: String, nullable: true, description: "Work address" })
  email!: string | null;
  static from(value: StaffMember): StaffMemberResponseDTO {
    return {
      id: value.id,
      municipalityId: value.tenantId,
      displayName: value.displayName,
      email: value.email,
    };
  }
}
