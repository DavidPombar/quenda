// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { NoticePreferences } from "../../../../../shared/application/notice-preferences";
export class NoticeChannelsResponseDTO {
  @ApiProperty({ description: "Sent by email" }) email!: boolean;
  @ApiProperty({ description: "Sent to devices with push notices on" })
  push!: boolean;
}
export class NoticePreferencesResponseDTO {
  @ApiProperty({
    description: "New reservation confirmed",
    type: NoticeChannelsResponseDTO,
  })
  confirmation!: NoticeChannelsResponseDTO;
  @ApiProperty({
    description: "Reservation moved to another time",
    type: NoticeChannelsResponseDTO,
  })
  change!: NoticeChannelsResponseDTO;
  @ApiProperty({
    description: "Reservation cancelled, by the person or the municipality",
    type: NoticeChannelsResponseDTO,
  })
  cancellation!: NoticeChannelsResponseDTO;
  @ApiProperty({
    description: "Reminder before the reservation",
    type: NoticeChannelsResponseDTO,
  })
  reminder!: NoticeChannelsResponseDTO;
  @ApiProperty({
    description: "No-show marked, booking ban and its lifting",
    type: NoticeChannelsResponseDTO,
  })
  penalty!: NoticeChannelsResponseDTO;
  static from(value: NoticePreferences): NoticePreferencesResponseDTO {
    return {
      confirmation: { ...value.confirmation },
      change: { ...value.change },
      cancellation: { ...value.cancellation },
      reminder: { ...value.reminder },
      penalty: { ...value.penalty },
    };
  }
}
