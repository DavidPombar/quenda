// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";
export class UnsubscribeRequestDTO {
  @ApiProperty({ description: "Signed token from the email link" })
  @IsString()
  @MaxLength(512)
  token!: string;
}
