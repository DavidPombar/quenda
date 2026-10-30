// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsObject, ValidateNested } from "class-validator";
export class NoticeChannelsRequestDTO {
  @ApiProperty({ description: "Send this notice by email" })
  @IsBoolean()
  email!: boolean;
  @ApiProperty({
    description: "Send this notice to the devices where push notices are on",
  })
  @IsBoolean()
  push!: boolean;
}
/** Every notice with both channels; the in-app notice is always kept. */
export class NotificationPreferencesRequestDTO {
  @ApiProperty({
    description: "New reservation confirmed",
    type: NoticeChannelsRequestDTO,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => NoticeChannelsRequestDTO)
  confirmation!: NoticeChannelsRequestDTO;
  @ApiProperty({
    description: "Reservation moved to another time",
    type: NoticeChannelsRequestDTO,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => NoticeChannelsRequestDTO)
  change!: NoticeChannelsRequestDTO;
  @ApiProperty({
    description: "Reservation cancelled, by the person or the municipality",
    type: NoticeChannelsRequestDTO,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => NoticeChannelsRequestDTO)
  cancellation!: NoticeChannelsRequestDTO;
  @ApiProperty({
    description: "Reminder before the reservation",
    type: NoticeChannelsRequestDTO,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => NoticeChannelsRequestDTO)
  reminder!: NoticeChannelsRequestDTO;
  @ApiProperty({
    description: "No-show marked, booking ban and its lifting",
    type: NoticeChannelsRequestDTO,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => NoticeChannelsRequestDTO)
  penalty!: NoticeChannelsRequestDTO;
}
