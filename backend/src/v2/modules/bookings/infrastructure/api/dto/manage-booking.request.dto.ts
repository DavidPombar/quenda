// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
/** Exactly one change: attendance, or a cancellation with its reason. */
export class ManageBookingRequestDTO {
  @ApiPropertyOptional({
    enum: ["no_show", "attended"],
    description:
      "Mark a no-show on the booking's day, or revert one to attended",
  })
  @IsOptional()
  @IsIn(["no_show", "attended"])
  attendance?: "no_show" | "attended";
  @ApiPropertyOptional({
    enum: ["cancelled"],
    description: "Cancel on behalf of the municipality",
  })
  @IsOptional()
  @IsIn(["cancelled"])
  status?: "cancelled";
  @ApiPropertyOptional({
    description: "Reason sent to the person; required to cancel",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
