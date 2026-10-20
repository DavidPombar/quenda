// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { AccountExport } from "../../../domain/account.read-model";
export class ExportMunicipalityResponseDTO {
  @ApiProperty({ description: "Public municipality identifier" }) slug!: string;
  @ApiProperty({ description: "Municipality name" }) name!: string;
  @ApiProperty({ description: "Municipal contact address" }) contact!: string;
  @ApiProperty({ description: "Privacy notice version in force" })
  legalVersion!: string;
  @ApiProperty({ description: "Personal data retention period in months" })
  retentionMonths!: number;
  static from(
    value: AccountExport["municipality"],
  ): ExportMunicipalityResponseDTO {
    return {
      slug: value.slug,
      name: value.name,
      contact: value.contact,
      legalVersion: value.legalVersion,
      retentionMonths: value.retentionMonths,
    };
  }
}
