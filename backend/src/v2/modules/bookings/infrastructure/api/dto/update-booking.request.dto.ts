// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsIn, IsUUID, MaxLength, ValidateIf } from "class-validator";

export class UpdateBookingRequestDTO {
  @ApiPropertyOptional({
    description: "New start instant; mutually exclusive with status",
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(64)
  start?: string;
  @ApiPropertyOptional({
    description:
      "Move to another resource of the same facility; mutually exclusive with status",
  })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsUUID()
  resourceId?: string;
  @ApiPropertyOptional({ description: "Cancel the reservation" })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsIn(["cancelled"])
  status?: "cancelled";
}
