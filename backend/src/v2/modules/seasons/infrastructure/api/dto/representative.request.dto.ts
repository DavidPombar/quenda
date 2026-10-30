// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, MaxLength } from "class-validator";
export class RepresentativeRequestDTO {
  @ApiProperty({
    description: "Address of an existing citizen account in the municipality",
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
