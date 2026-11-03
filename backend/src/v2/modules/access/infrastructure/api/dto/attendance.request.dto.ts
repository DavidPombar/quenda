// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";
export class AttendanceItemRequestDTO {
  @ApiProperty({ description: "Activity session UUID" })
  @IsUUID()
  sessionId!: string;
  @ApiProperty({ description: "Enrolment UUID" })
  @IsUUID()
  enrolmentId!: string;
  @ApiProperty({ enum: ["present", "absent"] })
  @IsIn(["present", "absent"])
  status!: "present" | "absent";
  @ApiProperty({ description: "Instant the mark was taken on the device" })
  @IsString()
  @MaxLength(64)
  recordedAt!: string;
}
export class AttendanceRequestDTO {
  @ApiProperty({
    description: "Roll-call marks, possibly taken while offline",
    type: [AttendanceItemRequestDTO],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemRequestDTO)
  items!: AttendanceItemRequestDTO[];
}
