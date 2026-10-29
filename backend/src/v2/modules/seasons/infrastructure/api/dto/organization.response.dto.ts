// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import type { Organization, Sport } from "../../../domain/season.read-model";
export class RepresentativeResponseDTO {
  @ApiProperty() userId!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ type: String, nullable: true }) email!: string | null;
}
export class OrganizationResponseDTO {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: String, nullable: true }) taxId!: string | null;
  @ApiProperty({
    enum: ["padel", "tennis", "futsal", "swimming"],
    nullable: true,
  })
  sport!: Sport | null;
  @ApiProperty({ type: String, nullable: true }) contactEmail!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty({ type: String, nullable: true }) archivedAt!: string | null;
  @ApiProperty({ type: [RepresentativeResponseDTO] })
  representatives!: RepresentativeResponseDTO[];
  static from(value: Organization): OrganizationResponseDTO {
    return {
      id: value.id,
      name: value.name,
      taxId: value.taxId,
      sport: value.sport,
      contactEmail: value.contactEmail,
      createdAt: value.createdAt.toString(),
      archivedAt: value.archivedAt?.toString() ?? null,
      representatives: value.representatives.map((item) => ({ ...item })),
    };
  }
}
