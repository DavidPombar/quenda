// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { AccountSummary } from "../../../domain/account.read-model";
import { ConsentResponseDTO } from "./consent.response.dto";
export class AccountResponseDTO {
  @ApiProperty({ description: "Authenticated user UUID" }) userId!: string;
  @ApiProperty({ description: "Display name" }) displayName!: string;
  @ApiProperty({ description: "Account role" }) role!: "citizen" | "manager";
  @ApiProperty({ description: "Privacy notice version currently in force" })
  currentLegalVersion!: string;
  @ApiProperty({
    description: "Whether the latest accepted version is the one in force",
  })
  consentUpToDate!: boolean;
  @ApiProperty({
    description: "Accepted versions, most recent first",
    type: [ConsentResponseDTO],
  })
  consents!: ConsentResponseDTO[];
  @ApiProperty({ description: "Number of reservations on record" })
  bookings!: number;
  @ApiProperty({ description: "Number of notices on record" })
  notifications!: number;
  @ApiProperty({
    description: "Address for email notices",
    type: String,
    nullable: true,
  })
  email!: string | null;
  @ApiProperty({
    description: "Language for outgoing messages",
    enum: ["gl", "es"],
    nullable: true,
  })
  locale!: "gl" | "es" | null;
  static from(value: AccountSummary): AccountResponseDTO {
    return {
      userId: value.profile.userId,
      displayName: value.profile.displayName,
      role: value.profile.role,
      currentLegalVersion: value.currentLegalVersion,
      consentUpToDate: value.consentUpToDate,
      consents: value.consents.map(ConsentResponseDTO.from),
      bookings: value.bookings,
      notifications: value.notifications,
      email: value.profile.email,
      locale: value.profile.locale,
    };
  }
}
