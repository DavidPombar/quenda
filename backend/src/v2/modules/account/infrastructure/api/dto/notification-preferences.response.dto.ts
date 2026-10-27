// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { NotificationPreferences } from "../../../domain/account.read-model";
export class NotificationPreferencesResponseDTO {
  @ApiProperty({ description: "Whether reminders are sent by email" })
  reminderEmails!: boolean;
  static from(
    value: NotificationPreferences,
  ): NotificationPreferencesResponseDTO {
    return { reminderEmails: value.reminderEmails };
  }
}
