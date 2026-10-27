// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";
export class NotificationPreferencesRequestDTO {
  @ApiProperty({ description: "Send reminders by email" })
  @IsBoolean()
  reminderEmails!: boolean;
}
