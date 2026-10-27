// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ExportedProfile } from "../../../domain/account.read-model";
import { Assurance } from "../../../../../shared/application/principal";
export class ExportedProfileResponseDTO {
  @ApiProperty({ description: "User UUID" }) userId!: string;
  @ApiProperty({ description: "Display name" }) displayName!: string;
  @ApiProperty({ description: "Account role" }) role!: "citizen" | "manager";
  @ApiProperty({
    description:
      "Email address for notices, from the identity provider or the demo account",
    type: String,
    nullable: true,
  })
  email!: string | null;
  @ApiProperty({
    description: "Language for outgoing messages",
    enum: ["gl", "es"],
    nullable: true,
  })
  locale!: "gl" | "es" | null;
  @ApiProperty({
    description: "How the identity was proven",
    enum: ["demo", "email", "eid", "local"],
  })
  assurance!: Assurance;
  @ApiProperty({
    description:
      "NIF, stored encrypted only where the municipality verifies residency",
    type: String,
    nullable: true,
  })
  nif!: string | null;
  static from(value: ExportedProfile): ExportedProfileResponseDTO {
    return {
      userId: value.userId,
      displayName: value.displayName,
      role: value.role,
      email: value.email,
      locale: value.locale,
      assurance: value.assurance,
      nif: value.nif,
    };
  }
}
