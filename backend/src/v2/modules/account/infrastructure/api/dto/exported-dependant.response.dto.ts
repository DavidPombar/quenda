// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ExportedDependant } from "../../../domain/account.read-model";
export class ExportedDependantResponseDTO {
  @ApiProperty({ description: "Dependant UUID" }) id!: string;
  @ApiProperty({ description: "First name only" }) firstName!: string;
  @ApiProperty() birthYear!: number;
  @ApiProperty({ description: "Guardianship declaration accepted" })
  declarationVersion!: string;
  @ApiProperty() declaredAt!: string;
  @ApiProperty() createdAt!: string;
  static from(value: ExportedDependant): ExportedDependantResponseDTO {
    return {
      ...value,
      declaredAt: value.declaredAt.toString(),
      createdAt: value.createdAt.toString(),
    };
  }
}
