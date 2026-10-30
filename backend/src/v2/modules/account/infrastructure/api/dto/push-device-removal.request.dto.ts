// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";
export class PushDeviceRemovalRequestDTO {
  @ApiProperty({ description: "Push service endpoint of the browser" })
  @IsString()
  @MaxLength(1000)
  endpoint!: string;
}
