// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsUUID, ValidateIf } from "class-validator";
export class EnrolmentRequestDTO {
  @ApiProperty({
    description:
      "Client-generated UUID; repeating it returns the same enrolment",
  })
  @IsUUID()
  id!: string;
  @ApiProperty({ description: "Activity UUID" })
  @IsUUID()
  activityId!: string;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: "A person in the adult's care; the adult takes part when missing",
  })
  @ValidateIf((_object: unknown, value: unknown) => value != null)
  @IsUUID()
  dependantId?: string | null;
}
