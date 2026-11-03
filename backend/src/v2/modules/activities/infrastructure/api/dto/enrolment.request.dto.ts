// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";
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
}
