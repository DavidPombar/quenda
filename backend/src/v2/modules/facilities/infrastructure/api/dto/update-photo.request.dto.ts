// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
export class PhotoAltRequestDTO {
  @ApiProperty({ description: "Galician (required)" })
  @IsString()
  @MaxLength(250)
  gl!: string;
  @ApiProperty({ description: "Spanish; empty uses the Galician text" })
  @IsString()
  @MaxLength(250)
  es!: string;
}
export class UpdatePhotoRequestDTO {
  @ApiProperty({ type: PhotoAltRequestDTO })
  @ValidateNested()
  @Type(() => PhotoAltRequestDTO)
  alt!: PhotoAltRequestDTO;
  @ApiProperty({ description: "Order in the gallery" })
  @IsInt()
  @Min(0)
  @Max(99)
  position!: number;
}
