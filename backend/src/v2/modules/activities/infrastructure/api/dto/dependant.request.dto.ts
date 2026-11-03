// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
export class DependantFieldsRequestDTO {
  @ApiProperty({ description: "First name only", maxLength: 60 })
  @IsString()
  @MaxLength(60)
  firstName!: string;
  @ApiProperty({ description: "Year of birth; ages are counted in the activity's year" })
  @IsInt()
  @Min(1900)
  @Max(2200)
  birthYear!: number;
}
export class DependantRequestDTO extends DependantFieldsRequestDTO {
  @ApiProperty({
    description: "Client-generated UUID; repeating it returns the same person",
  })
  @IsUUID()
  id!: string;
  @ApiProperty({
    description: "The adult declares parental authority or guardianship",
  })
  @IsBoolean()
  declared!: boolean;
  @ApiProperty({ description: "Version of the declaration text shown" })
  @IsString()
  @MaxLength(40)
  declarationVersion!: string;
}
