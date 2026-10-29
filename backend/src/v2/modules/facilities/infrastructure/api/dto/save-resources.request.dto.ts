// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";

export class ResourceDraftRequestDTO {
  @ApiProperty({ description: "Resource UUID; a new one creates the court" })
  @IsUUID()
  id!: string;
  @ApiProperty({ description: "Court or space name, unique in the facility" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;
  @ApiProperty({
    description:
      "Whole court this one is a part of (one level); null for a court of its own",
    type: String,
    nullable: true,
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== null)
  @IsUUID()
  parentId!: string | null;
  @ApiProperty({ description: "In service" })
  @IsBoolean()
  active!: boolean;
}
export class SaveResourcesRequestDTO {
  @ApiProperty({
    description:
      "Complete set of courts in display order; courts left out are removed",
    type: [ResourceDraftRequestDTO],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ResourceDraftRequestDTO)
  resources!: ResourceDraftRequestDTO[];
}
