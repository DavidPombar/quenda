// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  IsIn,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import type { StaffAccount } from "../../../domain/credential.repository";
export class StaffAccountResponseDTO {
  @ApiProperty() userId!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ enum: ["manager", "access"] }) role!: "manager" | "access";
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Null without a local account",
  })
  login!: string | null;
  @ApiProperty({ description: "Second factor set up" }) enrolled!: boolean;
  @ApiProperty() disabled!: boolean;
  static from(value: StaffAccount): StaffAccountResponseDTO {
    return {
      userId: value.userId,
      displayName: value.displayName,
      role: value.role,
      login: value.login,
      enrolled: value.enrolled,
      disabled: value.disabled,
    };
  }
}
export class CreateDoorStaffRequestDTO {
  @ApiProperty({ description: "Client-generated UUID; retries are idempotent" })
  @IsUUID()
  id!: string;
  @ApiProperty({ description: "Name shown in the backoffice" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;
  @ApiProperty({
    description: "Login: letters, digits, dots, dashes, underscores",
  })
  @Matches(/^[A-Za-z0-9._-]{3,64}$/)
  login!: string;
}
export class UpdateDoorStaffRequestDTO {
  @ApiProperty({ enum: ["reset", "disable", "enable"] })
  @IsIn(["reset", "disable", "enable"])
  action!: "reset" | "disable" | "enable";
}
export class StaffPathRequestDTO {
  @ApiProperty({ description: "User UUID" })
  @IsUUID()
  userId!: string;
}
export class StaffAccountChangeResponseDTO {
  @ApiProperty() login!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Shown once, when the account was created or reset",
  })
  temporaryPassword!: string | null;
}
