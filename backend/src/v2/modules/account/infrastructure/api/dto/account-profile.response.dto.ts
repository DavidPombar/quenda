// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { AccountProfile } from "../../../domain/account.read-model";
export class AccountProfileResponseDTO {
  @ApiProperty({ description: "User UUID" }) userId!: string;
  @ApiProperty({ description: "Display name" }) displayName!: string;
  @ApiProperty({ description: "Account role" }) role!: "citizen" | "manager";
  @ApiProperty({
    description: "Address for email notices",
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
  static from(value: AccountProfile): AccountProfileResponseDTO {
    return {
      userId: value.userId,
      displayName: value.displayName,
      role: value.role,
      email: value.email,
      locale: value.locale,
    };
  }
}
