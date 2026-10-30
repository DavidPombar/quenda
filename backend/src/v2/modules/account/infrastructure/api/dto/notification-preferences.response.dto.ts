// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { NotificationSettings } from "../../../domain/account.read-model";
import { NoticePreferencesResponseDTO } from "./notice-preferences.response.dto";
export class PushStatusResponseDTO {
  @ApiProperty({
    description:
      "Whether this deployment can send push notices (VAPID keys set)",
  })
  available!: boolean;
  @ApiProperty({
    description: "VAPID public key to subscribe with (base64url)",
    type: String,
    nullable: true,
  })
  publicKey!: string | null;
  @ApiProperty({ description: "Devices of this person receiving push notices" })
  devices!: number;
}
export class NotificationPreferencesResponseDTO {
  @ApiProperty({
    description: "Choice per notice and channel",
    type: NoticePreferencesResponseDTO,
  })
  preferences!: NoticePreferencesResponseDTO;
  @ApiProperty({ description: "Push notices", type: PushStatusResponseDTO })
  push!: PushStatusResponseDTO;
  static from(value: NotificationSettings): NotificationPreferencesResponseDTO {
    return {
      preferences: NoticePreferencesResponseDTO.from(value.preferences),
      push: { ...value.push },
    };
  }
}
