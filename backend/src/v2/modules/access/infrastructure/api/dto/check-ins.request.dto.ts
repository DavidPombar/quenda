// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
  IsIn,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";
export class CheckInItemRequestDTO {
  @ApiProperty({ description: "Reservation UUID" })
  @IsUUID()
  bookingId!: string;
  @ApiProperty({
    description: "Reservation revision seen by the door",
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  sequence!: number;
  @ApiProperty({ description: "Instant the person was let in" })
  @IsString()
  @MaxLength(64)
  checkedInAt!: string;
  @ApiProperty({ enum: ["qr", "manual"] })
  @IsIn(["qr", "manual"])
  method!: "qr" | "manual";
}
export class CheckInsRequestDTO {
  @ApiProperty({
    description: "Entries recorded at the door, possibly while offline",
    type: [CheckInItemRequestDTO],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CheckInItemRequestDTO)
  items!: CheckInItemRequestDTO[];
}
