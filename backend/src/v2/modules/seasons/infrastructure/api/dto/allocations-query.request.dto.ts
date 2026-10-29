// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";
export class AllocationsQueryRequestDTO {
  @ApiProperty() @IsUUID() campaignId!: string;
}
