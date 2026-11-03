// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import type { Dependant } from "../../../domain/dependant.entity";
export class DependantResponseDTO {
  @ApiProperty() id!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() birthYear!: number;
  @ApiProperty({ description: "Guardianship declaration accepted" })
  declarationVersion!: string;
  @ApiProperty() declaredAt!: string;
  @ApiProperty() createdAt!: string;
  static from(value: Dependant): DependantResponseDTO {
    return {
      id: value.id,
      firstName: value.firstName,
      birthYear: value.birthYear,
      declarationVersion: value.declarationVersion,
      declaredAt: value.declaredAt.toString(),
      createdAt: value.createdAt.toString(),
    };
  }
}
